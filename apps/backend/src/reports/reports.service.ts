import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /** High-level financial overview for a given month/year (defaults to current month). */
  async financialOverview(month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const [collected, billed, outstanding, expenses, payroll] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { createdAt: { gte: start, lt: end }, NOT: { status: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { NOT: { status: 'CANCELLED' } },
        _sum: { dueAmount: true },
      }),
      this.prisma.expense.aggregate({
        where: { date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.payroll.aggregate({
        where: { month: m, year: y },
        _sum: { netSalary: true },
      }),
    ]);

    const income = collected._sum.amount ?? 0;
    const totalExpense = (expenses._sum.amount ?? 0) + (payroll._sum.netSalary ?? 0);

    return {
      period: { month: m, year: y },
      collected: income,
      billed: billed._sum.totalAmount ?? 0,
      outstanding: outstanding._sum.dueAmount ?? 0,
      expenses: expenses._sum.amount ?? 0,
      payroll: payroll._sum.netSalary ?? 0,
      totalExpense,
      netBalance: income - totalExpense,
    };
  }

  /** Month-by-month collection vs expense for a year (for charts). */
  async monthlyTrend(year?: number) {
    const y = year ?? new Date().getFullYear();
    const months: { month: number; collected: number; expense: number }[] = [];

    for (let m = 1; m <= 12; m++) {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      const [collected, expense, payroll] = await Promise.all([
        this.prisma.payment.aggregate({
          where: { status: 'COMPLETED', paidAt: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { date: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
        this.prisma.payroll.aggregate({
          where: { month: m, year: y },
          _sum: { netSalary: true },
        }),
      ]);
      months.push({
        month: m,
        collected: collected._sum.amount ?? 0,
        expense: (expense._sum.amount ?? 0) + (payroll._sum.netSalary ?? 0),
      });
    }

    return { year: y, months };
  }

  /** Outstanding dues grouped by class. */
  async outstandingByClass() {
    const invoices = await this.prisma.invoice.findMany({
      where: { dueAmount: { gt: 0 }, NOT: { status: 'CANCELLED' } },
      include: {
        student: { include: { section: { include: { class: true } } } },
      },
    });

    const map = new Map<string, { className: string; dueAmount: number; count: number }>();
    for (const inv of invoices) {
      const className = inv.student.section?.class.name ?? 'Unassigned';
      const cur = map.get(className) ?? { className, dueAmount: 0, count: 0 };
      cur.dueAmount += inv.dueAmount;
      cur.count += 1;
      map.set(className, cur);
    }

    return Array.from(map.values()).sort((a, b) => b.dueAmount - a.dueAmount);
  }
}
