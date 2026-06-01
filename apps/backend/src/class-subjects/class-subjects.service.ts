import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassSubjectDto, UpdateClassSubjectDto } from './dto/class-subject.dto';

@Injectable()
export class ClassSubjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(classId?: string) {
    return this.prisma.classSubject.findMany({
      where: classId ? { classId } : undefined,
      orderBy: { subject: { name: 'asc' } },
      include: {
        class: { include: { academicYear: { select: { name: true } } } },
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(dto: CreateClassSubjectDto) {
    const existing = await this.prisma.classSubject.findUnique({
      where: { classId_subjectId: { classId: dto.classId, subjectId: dto.subjectId } },
    });
    if (existing) throw new ConflictException('Subject already assigned to this class');

    return this.prisma.classSubject.create({
      data: {
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        fullMarks: dto.fullMarks ?? 100,
        passMarks: dto.passMarks ?? 40,
        theoryMarks: dto.theoryMarks,
        practicalMarks: dto.practicalMarks,
      },
      include: { subject: true, teacher: true },
    });
  }

  async update(id: string, dto: UpdateClassSubjectDto) {
    const existing = await this.prisma.classSubject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Class subject not found');
    return this.prisma.classSubject.update({
      where: { id },
      data: dto,
      include: { subject: true, teacher: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.classSubject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Class subject not found');
    return this.prisma.classSubject.delete({ where: { id } });
  }
}
