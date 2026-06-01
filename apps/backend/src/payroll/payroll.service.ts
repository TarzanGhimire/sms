import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  GeneratePayrollDto, CreatePayrollDto, UpdatePayrollDto, QueryPayrollDto,
} from './dto/payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryPayrollDto) {
    const where: Prisma.PayrollWhereInput = {};
    if (query.month) where.month = query.month;
    if (query.year) where.year = query.year;
    if (query.staffId) where.staffId = query.staffId;

    return this.prisma.payroll.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, staffType: true } },
      },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.payroll.findUnique({
      where: { id },
      include: { staff: { include: { user: { select: { email: true } } } } },
    });
    if (!p) throw new NotFoundException('Payroll record not found');
    return p;
  }

  /** Generate payroll for all staff who have a salary configured and no record yet for the month. */
  async generateMonthly(dto: GeneratePayrollDto) {
    const academicYearId = await this.getCurrentAcademicYearId();
    const staffWithSalary = await this.prisma.staff.findMany({
      where: { salary: { isNot: null }, isActive: true },
      include: { salary: true },
    });

    const created: string[] = [];
    const skipped: { name: string; reason: string }[] = [];

    for (const s of staffWithSalary) {
      if (!s.salary) continue;
      const existing = await this.prisma.payroll.findUnique({
        where: { staffId_month_year: { staffId: s.id, month: dto.month, year: dto.year } },
      });
      if (existing) {
        skipped.push({ name: `${s.firstName} ${s.lastName}`, reason: 'Already generated' });
        continue;
      }

      const net = s.salary.basicSalary + s.salary.allowances - s.salary.deductions;
      await this.prisma.payroll.create({
        data: {
          staffId: s.id,
          academicYearId,
          month: dto.month,
          year: dto.year,
          basicSalary: s.salary.basicSalary,
          allowances: s.salary.allowances,
          bonus: 0,
          deductions: s.salary.deductions,
          netSalary: net,
          status: 'PENDING',
        },
      });
      created.push(`${s.firstName} ${s.lastName}`);
    }

    return { generated: created.length, skipped: skipped.length, details: { created, skipped } };
  }

  async update(id: string, dto: UpdatePayrollDto) {
    const p = await this.findOne(id);
    if (p.status === 'PAID') throw new BadRequestException('Cannot edit a paid payroll');

    const bonus = dto.bonus ?? p.bonus;
    const deductions = dto.deductions ?? p.deductions;
    const net = p.basicSalary + p.allowances + bonus - deductions;

    return this.prisma.payroll.update({
      where: { id },
      data: { bonus, deductions, netSalary: net, notes: dto.notes ?? p.notes },
    });
  }

  async markPaid(id: string) {
    const p = await this.findOne(id);
    if (p.status === 'PAID') throw new BadRequestException('Already paid');
    return this.prisma.payroll.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async summary(month?: number, year?: number) {
    const where: Prisma.PayrollWhereInput = {};
    if (month) where.month = month;
    if (year) where.year = year;

    const [agg, paid, pending] = await Promise.all([
      this.prisma.payroll.aggregate({ where, _sum: { netSalary: true }, _count: true }),
      this.prisma.payroll.aggregate({ where: { ...where, status: 'PAID' }, _sum: { netSalary: true } }),
      this.prisma.payroll.aggregate({ where: { ...where, status: 'PENDING' }, _sum: { netSalary: true } }),
    ]);

    return {
      totalNet: agg._sum.netSalary ?? 0,
      count: agg._count,
      paidAmount: paid._sum.netSalary ?? 0,
      pendingAmount: pending._sum.netSalary ?? 0,
    };
  }

  private async getCurrentAcademicYearId(): Promise<string> {
    const current = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!current) throw new BadRequestException('No current academic year set');
    return current.id;
  }
}
