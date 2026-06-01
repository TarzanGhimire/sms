import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  /** Full JSON export of core data (excludes auth secrets). */
  async exportData() {
    const [
      academicYears, classes, sections, subjects, classSubjects,
      students, guardians, teachers, staff, salaries,
      feeCategories, feeStructures, discounts, invoices, invoiceItems,
      payments, expenses, payrolls, exams, marks, settings,
    ] = await Promise.all([
      this.prisma.academicYear.findMany(),
      this.prisma.class.findMany(),
      this.prisma.section.findMany(),
      this.prisma.subject.findMany(),
      this.prisma.classSubject.findMany(),
      this.prisma.student.findMany(),
      this.prisma.guardian.findMany(),
      this.prisma.teacher.findMany(),
      this.prisma.staff.findMany(),
      this.prisma.salary.findMany(),
      this.prisma.feeCategory.findMany(),
      this.prisma.feeStructure.findMany(),
      this.prisma.discount.findMany(),
      this.prisma.invoice.findMany(),
      this.prisma.invoiceItem.findMany(),
      this.prisma.payment.findMany(),
      this.prisma.expense.findMany(),
      this.prisma.payroll.findMany(),
      this.prisma.exam.findMany(),
      this.prisma.mark.findMany(),
      this.prisma.schoolSettings.findMany(),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        academicYears, classes, sections, subjects, classSubjects,
        students, guardians, teachers, staff, salaries,
        feeCategories, feeStructures, discounts, invoices, invoiceItems,
        payments, expenses, payrolls, exams, marks, settings,
      },
      counts: {
        students: students.length,
        teachers: teachers.length,
        staff: staff.length,
        invoices: invoices.length,
        payments: payments.length,
        expenses: expenses.length,
      },
    };
  }
}
