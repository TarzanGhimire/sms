import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.exam.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        academicYear: { select: { name: true } },
        _count: { select: { marks: true } },
      },
    });
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { academicYear: true },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async create(dto: CreateExamDto) {
    const academicYearId = dto.academicYearId ?? (await this.getCurrentAcademicYearId());
    return this.prisma.exam.create({
      data: {
        name: dto.name,
        examType: dto.examType,
        academicYearId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: { academicYear: true },
    });
  }

  async update(id: string, dto: UpdateExamDto) {
    await this.findOne(id);
    return this.prisma.exam.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.examType && { examType: dto.examType }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
      },
    });
  }

  async remove(id: string) {
    const exam = await this.findOne(id);
    if (exam.isPublished) {
      throw new BadRequestException('Cannot delete a published exam');
    }
    return this.prisma.exam.delete({ where: { id } });
  }

  private async getCurrentAcademicYearId(): Promise<string> {
    const current = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!current) throw new BadRequestException('No current academic year set');
    return current.id;
  }
}
