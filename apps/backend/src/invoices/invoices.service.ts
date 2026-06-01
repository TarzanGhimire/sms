import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInvoiceDto, UpdateInvoiceDto, GenerateMonthlyInvoicesDto, QueryInvoicesDto,
} from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryInvoicesDto) {
    const where: Prisma.InvoiceWhereInput = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;
    if (query.billingMonth) where.billingMonth = query.billingMonth;
    if (query.billingYear) where.billingYear = query.billingYear;
    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { student: {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { studentId: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true, studentId: true, firstName: true, lastName: true,
            section: { select: { name: true, class: { select: { name: true } } } },
          },
        },
        academicYear: { select: { name: true } },
        _count: { select: { items: true, payments: true } },
      },
    });
  }

  async findOne(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            section: { include: { class: true } },
            guardians: { where: { isPrimary: true }, take: 1 },
          },
        },
        academicYear: true,
        items: { include: { discount: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async create(dto: CreateInvoiceDto) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const academicYearId = dto.academicYearId ?? (await this.getCurrentAcademicYearId());

    let subtotal = 0;
    let discountTotal = 0;
    const itemsData = dto.items.map((item) => {
      const da = item.discountAmount ?? 0;
      const net = Math.max(0, item.amount - da);
      subtotal += item.amount;
      discountTotal += da;
      return {
        description: item.description,
        amount: item.amount,
        discountId: item.discountId,
        discountAmount: da,
        netAmount: net,
      };
    });

    const fine = dto.fineAmount ?? 0;
    const totalAmount = Math.max(0, subtotal - discountTotal + fine);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : this.defaultDueDate(dto.billingYear, dto.billingMonth);
    const invoiceNumber = await this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: dto.studentId,
        academicYearId,
        billingMonth: dto.billingMonth,
        billingYear: dto.billingYear,
        dueDate,
        subtotal,
        discountAmount: discountTotal,
        fineAmount: fine,
        totalAmount,
        dueAmount: totalAmount,
        notes: dto.notes,
        status: 'SENT',
        items: { create: itemsData },
      },
      include: { items: true, student: true },
    });
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const inv = await this.findOne(id);

    const data: Prisma.InvoiceUpdateInput = {};
    if (dto.status) data.status = dto.status;
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (dto.fineAmount !== undefined && dto.fineAmount !== inv.fineAmount) {
      const newTotal = Math.max(0, inv.subtotal - inv.discountAmount + dto.fineAmount);
      data.fineAmount = dto.fineAmount;
      data.totalAmount = newTotal;
      data.dueAmount = Math.max(0, newTotal - inv.paidAmount);
    }

    return this.prisma.invoice.update({ where: { id }, data });
  }

  async remove(id: string) {
    const inv = await this.findOne(id);
    if (inv.paidAmount > 0) {
      throw new BadRequestException('Cannot delete invoice with payments. Cancel instead.');
    }
    return this.prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async generateMonthly(dto: GenerateMonthlyInvoicesDto) {
    const academicYearId = await this.getCurrentAcademicYearId();
    const where: Prisma.StudentWhereInput = { status: 'ACTIVE' };
    if (dto.sectionId) where.sectionId = dto.sectionId;
    else if (dto.classId) where.section = { classId: dto.classId };

    const students = await this.prisma.student.findMany({
      where,
      include: { section: { include: { class: true } } },
    });

    const created: string[] = [];
    const skipped: { studentId: string; reason: string }[] = [];

    for (const student of students) {
      if (!student.section) {
        skipped.push({ studentId: student.studentId, reason: 'Not assigned to a section' });
        continue;
      }

      const existing = await this.prisma.invoice.findFirst({
        where: {
          studentId: student.id,
          billingMonth: dto.billingMonth,
          billingYear: dto.billingYear,
          NOT: { status: 'CANCELLED' },
        },
      });
      if (existing) {
        skipped.push({ studentId: student.studentId, reason: 'Invoice already exists for this month' });
        continue;
      }

      const fees = await this.prisma.feeStructure.findMany({
        where: {
          classId: student.section.classId,
          isActive: true,
          feeCategory: { feeType: 'RECURRING' },
        },
        include: { feeCategory: true },
      });

      if (fees.length === 0) {
        skipped.push({ studentId: student.studentId, reason: 'No recurring fees configured for class' });
        continue;
      }

      const items = fees.map((f) => ({
        description: f.feeCategory.name,
        amount: f.amount,
        discountAmount: 0,
        netAmount: f.amount,
      }));
      const subtotal = items.reduce((s, i) => s + i.amount, 0);

      const dueDate = this.defaultDueDate(dto.billingYear, dto.billingMonth, dto.dueDay ?? 20);
      const invoiceNumber = await this.generateInvoiceNumber();

      const inv = await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          studentId: student.id,
          academicYearId,
          billingMonth: dto.billingMonth,
          billingYear: dto.billingYear,
          dueDate,
          subtotal,
          discountAmount: 0,
          fineAmount: 0,
          totalAmount: subtotal,
          dueAmount: subtotal,
          status: 'SENT',
          items: { create: items },
        },
      });
      created.push(inv.invoiceNumber);
    }

    return { generated: created.length, skipped: skipped.length, details: { created, skipped } };
  }

  async stats() {
    const [total, paid, overdue, pending] = await Promise.all([
      this.prisma.invoice.aggregate({ _sum: { totalAmount: true, paidAmount: true, dueAmount: true } }),
      this.prisma.invoice.count({ where: { status: 'PAID' } }),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      this.prisma.invoice.count({ where: { status: { in: ['SENT', 'PARTIALLY_PAID'] } } }),
    ]);
    return {
      totalBilled: total._sum.totalAmount ?? 0,
      totalCollected: total._sum.paidAmount ?? 0,
      totalOutstanding: total._sum.dueAmount ?? 0,
      counts: { paid, overdue, pending },
    };
  }

  async markOverdue() {
    const now = new Date();
    return this.prisma.invoice.updateMany({
      where: {
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
        dueAmount: { gt: 0 },
      },
      data: { status: 'OVERDUE' },
    });
  }

  private async getCurrentAcademicYearId(): Promise<string> {
    const current = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!current) throw new BadRequestException('No current academic year set');
    return current.id;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await this.prisma.invoice.count();
    return `INV${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private defaultDueDate(year: number, month: number, day = 20): Date {
    return new Date(year, month - 1, day);
  }
}
