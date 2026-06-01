import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkMarksDto } from './dto/mark.dto';
import { calculateGrade, gpaToGrade, isSubjectPass } from '../common/utils/grading';

@Injectable()
export class MarksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns everything the frontend needs to render a marks-entry grid:
   * the section's students, the class's configured subjects, and any
   * marks already entered for this exam.
   */
  async getEntryGrid(examId: string, sectionId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
    if (!section) throw new NotFoundException('Section not found');

    const [students, classSubjects, existingMarks] = await Promise.all([
      this.prisma.student.findMany({
        where: { sectionId, status: 'ACTIVE' },
        orderBy: { firstName: 'asc' },
        select: { id: true, studentId: true, firstName: true, lastName: true },
      }),
      this.prisma.classSubject.findMany({
        where: { classId: section.classId },
        include: { subject: true },
        orderBy: { subject: { name: 'asc' } },
      }),
      this.prisma.mark.findMany({ where: { examId, student: { sectionId } } }),
    ]);

    return {
      exam: { id: exam.id, name: exam.name, isPublished: exam.isPublished },
      section: { id: section.id, name: section.name, className: section.class.name },
      students,
      subjects: classSubjects.map((cs) => ({
        subjectId: cs.subjectId,
        name: cs.subject.name,
        code: cs.subject.code,
        fullMarks: cs.fullMarks,
        passMarks: cs.passMarks,
        theoryMarks: cs.theoryMarks,
        practicalMarks: cs.practicalMarks,
        hasPractical: cs.practicalMarks != null && cs.practicalMarks > 0,
      })),
      marks: existingMarks,
    };
  }

  async bulkUpsert(dto: BulkMarksDto) {
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Exam not found');
    if (exam.isPublished) {
      throw new BadRequestException('Cannot edit marks for a published exam');
    }

    const classSubjects = await this.prisma.classSubject.findMany({
      where: { classId: dto.classId },
    });
    const csMap = new Map(classSubjects.map((cs) => [cs.subjectId, cs]));

    let saved = 0;
    for (const m of dto.marks) {
      const cs = csMap.get(m.subjectId);
      if (!cs) continue;

      const total = m.isAbsent
        ? 0
        : m.theoryMarks != null || m.practicalMarks != null
          ? (m.theoryMarks ?? 0) + (m.practicalMarks ?? 0)
          : (m.totalMarks ?? 0);

      const { grade, gradePoint } = m.isAbsent
        ? { grade: 'ABS', gradePoint: 0 }
        : calculateGrade(total, cs.fullMarks);

      await this.prisma.mark.upsert({
        where: {
          examId_studentId_subjectId: {
            examId: dto.examId,
            studentId: m.studentId,
            subjectId: m.subjectId,
          },
        },
        create: {
          examId: dto.examId,
          studentId: m.studentId,
          subjectId: m.subjectId,
          teacherId: cs.teacherId,
          theoryMarks: m.theoryMarks,
          practicalMarks: m.practicalMarks,
          totalMarks: total,
          grade,
          gradePoint,
          remarks: m.remarks,
          isAbsent: m.isAbsent ?? false,
        },
        update: {
          theoryMarks: m.theoryMarks,
          practicalMarks: m.practicalMarks,
          totalMarks: total,
          grade,
          gradePoint,
          remarks: m.remarks,
          isAbsent: m.isAbsent ?? false,
        },
      });
      saved += 1;
    }

    return { saved };
  }

  /** Compute ranked results for a whole section. */
  async getSectionResults(examId: string, sectionId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { academicYear: true },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
    if (!section) throw new NotFoundException('Section not found');

    const classSubjects = await this.prisma.classSubject.findMany({
      where: { classId: section.classId },
      include: { subject: true },
    });
    const csMap = new Map(classSubjects.map((cs) => [cs.subjectId, cs]));

    const students = await this.prisma.student.findMany({
      where: { sectionId, status: 'ACTIVE' },
      include: { marks: { where: { examId } } },
    });

    const cards = students.map((student) =>
      this.buildReportCard(student, student.marks, csMap, classSubjects),
    );

    // Rank by total marks (only students with marks ranked)
    const ranked = cards
      .filter((c) => c.subjects.length > 0)
      .sort((a, b) => b.totalObtained - a.totalObtained);
    ranked.forEach((c, i) => {
      c.rank = i + 1;
    });

    return {
      exam: {
        id: exam.id, name: exam.name, examType: exam.examType,
        isPublished: exam.isPublished, academicYear: exam.academicYear.name,
      },
      section: { id: section.id, name: section.name, className: section.class.name },
      results: cards,
    };
  }

  /** Single-student report card for an exam. */
  async getStudentReportCard(examId: string, studentId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { academicYear: true },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        section: { include: { class: true } },
        guardians: { where: { isPrimary: true }, take: 1 },
        marks: { where: { examId }, include: { subject: true } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (!student.section) throw new BadRequestException('Student has no section');

    const classSubjects = await this.prisma.classSubject.findMany({
      where: { classId: student.section.classId },
      include: { subject: true },
    });
    const csMap = new Map(classSubjects.map((cs) => [cs.subjectId, cs]));

    const card = this.buildReportCard(student, student.marks, csMap, classSubjects);

    // Compute rank within section
    const section = await this.getSectionResults(examId, student.sectionId!);
    const mine = section.results.find((r) => r.studentId === student.id);

    return {
      exam: {
        id: exam.id, name: exam.name, examType: exam.examType,
        isPublished: exam.isPublished, academicYear: exam.academicYear.name,
      },
      student: {
        id: student.id, studentId: student.studentId,
        firstName: student.firstName, lastName: student.lastName,
        className: student.section.class.name, sectionName: student.section.name,
        guardian: student.guardians[0]?.fullName ?? null,
      },
      ...card,
      rank: mine?.rank ?? null,
      totalStudents: section.results.filter((r) => r.subjects.length > 0).length,
    };
  }

  private buildReportCard(
    student: { id: string; studentId: string; firstName: string; lastName: string },
    marks: { subjectId: string; theoryMarks: number | null; practicalMarks: number | null; totalMarks: number; grade: string | null; gradePoint: number | null; isAbsent: boolean; remarks: string | null }[],
    csMap: Map<string, { fullMarks: number; passMarks: number; subject?: { name: string; code: string } }>,
    classSubjects: { subjectId: string; subject: { name: string; code: string } }[],
  ) {
    const subjects = marks.map((m) => {
      const cs = csMap.get(m.subjectId);
      const subjectInfo = classSubjects.find((c) => c.subjectId === m.subjectId)?.subject;
      return {
        subjectId: m.subjectId,
        name: subjectInfo?.name ?? 'Unknown',
        code: subjectInfo?.code ?? '',
        fullMarks: cs?.fullMarks ?? 100,
        passMarks: cs?.passMarks ?? 40,
        theoryMarks: m.theoryMarks,
        practicalMarks: m.practicalMarks,
        obtained: m.totalMarks,
        grade: m.grade,
        gradePoint: m.gradePoint,
        isAbsent: m.isAbsent,
        passed: isSubjectPass(m.totalMarks, cs?.passMarks ?? 40, m.isAbsent),
        remarks: m.remarks,
      };
    });

    const totalFull = subjects.reduce((s, x) => s + x.fullMarks, 0);
    const totalObtained = subjects.reduce((s, x) => s + x.obtained, 0);
    const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
    const gpa = subjects.length > 0
      ? subjects.reduce((s, x) => s + (x.gradePoint ?? 0), 0) / subjects.length
      : 0;
    const allPassed = subjects.length > 0 && subjects.every((x) => x.passed);

    return {
      studentId: student.id,
      studentCode: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
      subjects,
      totalFull,
      totalObtained,
      percentage: Math.round(percentage * 100) / 100,
      gpa: Math.round(gpa * 100) / 100,
      overallGrade: gpaToGrade(gpa),
      result: allPassed ? 'PASS' : 'FAIL',
      rank: null as number | null,
    };
  }
}
