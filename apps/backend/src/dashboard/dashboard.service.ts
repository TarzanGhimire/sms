import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async stats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalStudents, totalStaff, totalTeachers, activeClasses,
      monthRevenue, pendingInvoices, overdueInvoices, upcomingExams,
    ] = await Promise.all([
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.staff.count({ where: { isActive: true } }),
      this.prisma.teacher.count({ where: { isActive: true } }),
      this.prisma.class.count(),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.invoice.count({ where: { status: { in: ['SENT', 'PARTIALLY_PAID'] } } }),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      this.prisma.exam.count({ where: { startDate: { gte: now }, isPublished: false } }),
    ]);

    return {
      totalStudents,
      totalStaff: totalStaff + totalTeachers,
      monthRevenue: monthRevenue._sum.amount ?? 0,
      pendingInvoices,
      overdueInvoices,
      activeClasses,
      upcomingExams,
    };
  }

  async recentActivity() {
    const [recentPayments, recentStudents] = await Promise.all([
      this.prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { invoice: { include: { student: { select: { firstName: true, lastName: true } } } } },
      }),
      this.prisma.student.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, studentId: true, createdAt: true },
      }),
    ]);
    return { recentPayments, recentStudents };
  }
}
