import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStudentDto, UpdateStudentDto, QueryStudentsDto, GuardianDto,
} from './dto/student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryStudentsDto) {
    const where: Prisma.StudentWhereInput = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { studentId: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.classId) where.section = { classId: query.classId };
    if (query.status) where.status = query.status;

    return this.prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        section: { include: { class: true } },
        guardians: { where: { isPrimary: true }, take: 1 },
      },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        section: { include: { class: { include: { academicYear: true } } } },
        guardians: true,
        documents: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async create(dto: CreateStudentDto) {
    const studentId = await this.generateStudentId();
    const { guardians, ...studentData } = dto;

    return this.prisma.student.create({
      data: {
        ...studentData,
        studentId,
        ...(studentData.dob && { dob: new Date(studentData.dob) }),
        ...(studentData.admissionDate && { admissionDate: new Date(studentData.admissionDate) }),
        guardians: guardians?.length
          ? {
              create: guardians.map((g, i) => ({
                ...g,
                isPrimary: g.isPrimary ?? i === 0,
              })),
            }
          : undefined,
      },
      include: { section: { include: { class: true } }, guardians: true },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dob && { dob: new Date(dto.dob) }),
      },
      include: { section: { include: { class: true } }, guardians: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.student.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async addGuardian(studentId: string, dto: GuardianDto) {
    await this.findOne(studentId);
    if (dto.isPrimary) {
      await this.prisma.guardian.updateMany({
        where: { studentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return this.prisma.guardian.create({ data: { ...dto, studentId } });
  }

  async updateGuardian(id: string, dto: Partial<GuardianDto>) {
    const guardian = await this.prisma.guardian.findUnique({ where: { id } });
    if (!guardian) throw new NotFoundException('Guardian not found');

    if (dto.isPrimary) {
      await this.prisma.guardian.updateMany({
        where: { studentId: guardian.studentId, isPrimary: true, NOT: { id } },
        data: { isPrimary: false },
      });
    }
    return this.prisma.guardian.update({ where: { id }, data: dto });
  }

  async removeGuardian(id: string) {
    return this.prisma.guardian.delete({ where: { id } });
  }

  async getStats() {
    const [total, active, byGender] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.student.groupBy({
        by: ['gender'],
        _count: true,
        where: { status: 'ACTIVE' },
      }),
    ]);
    return { total, active, byGender };
  }

  private async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await this.prisma.student.count();
    const padded = String(count + 1).padStart(4, '0');
    return `STU${year}${padded}`;
  }
}
