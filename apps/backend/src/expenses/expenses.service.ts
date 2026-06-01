import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, QueryExpensesDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryExpensesDto) {
    const where: Prisma.ExpenseWhereInput = {};
    if (query.category) where.category = query.category;
    if (query.month && query.year) {
      const start = new Date(query.year, query.month - 1, 1);
      const end = new Date(query.year, query.month, 1);
      where.date = { gte: start, lt: end };
    } else if (query.year) {
      where.date = { gte: new Date(query.year, 0, 1), lt: new Date(query.year + 1, 0, 1) };
    }

    return this.prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
  }

  async findOne(id: string) {
    const e = await this.prisma.expense.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Expense not found');
    return e;
  }

  create(dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: { ...dto, date: new Date(dto.date) },
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOne(id);
    return this.prisma.expense.update({
      where: { id },
      data: { ...dto, ...(dto.date && { date: new Date(dto.date) }) },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async summary(month?: number, year?: number) {
    const y = year ?? new Date().getFullYear();
    const where: Prisma.ExpenseWhereInput = {};
    if (month) {
      where.date = { gte: new Date(y, month - 1, 1), lt: new Date(y, month, 1) };
    } else {
      where.date = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
    }

    const [total, byCategory] = await Promise.all([
      this.prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total: total._sum.amount ?? 0,
      count: total._count,
      byCategory: byCategory
        .map((c) => ({ category: c.category, amount: c._sum.amount ?? 0, count: c._count }))
        .sort((a, b) => b.amount - a.amount),
    };
  }
}
