import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, QueryPaymentsDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryPaymentsDto) {
    const where: Prisma.PaymentWhereInput = {};
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.method) where.method = query.method;
    if (query.status) where.status = query.status;
    if (query.studentId) where.invoice = { studentId: query.studentId };

    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          include: {
            student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            student: { include: { section: { include: { class: true } } } },
            items: true,
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Payment not found');
    return p;
  }

  async create(dto: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: dto.invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status === 'CANCELLED') throw new BadRequestException('Invoice is cancelled');
      if (invoice.dueAmount <= 0) throw new BadRequestException('Invoice already fully paid');
      if (dto.amount > invoice.dueAmount) {
        throw new BadRequestException(
          `Payment of ${dto.amount} exceeds remaining due of ${invoice.dueAmount}`,
        );
      }

      const receiptNumber = await this.generateReceiptNumber(tx);

      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          receiptNumber,
          amount: dto.amount,
          method: dto.method,
          transactionId: dto.transactionId,
          notes: dto.notes,
          status: dto.method === 'CASH' || dto.method === 'BANK_TRANSFER' ? 'COMPLETED' : 'PENDING',
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        },
      });

      const newPaid = invoice.paidAmount + dto.amount;
      const newDue = Math.max(0, invoice.totalAmount - newPaid);
      let newStatus: InvoiceStatus = invoice.status;
      if (newDue === 0) newStatus = 'PAID';
      else if (newPaid > 0) newStatus = 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paidAmount: newPaid, dueAmount: newDue, status: newStatus },
      });

      return payment;
    });
  }

  async dailyCollection(date?: string) {
    const day = date ? new Date(date) : new Date();
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const result = await this.prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
      _count: true,
    });

    const byMethod = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { status: 'COMPLETED', paidAt: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: true,
    });

    return {
      date: start.toISOString().slice(0, 10),
      totalAmount: result._sum.amount ?? 0,
      totalCount: result._count,
      byMethod: byMethod.map((m) => ({ method: m.method, amount: m._sum.amount ?? 0, count: m._count })),
    };
  }

  private async generateReceiptNumber(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await tx.payment.count();
    return `RCP${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
