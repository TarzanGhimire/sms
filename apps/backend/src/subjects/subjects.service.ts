import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { classSubjects: true } } },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        classSubjects: { include: { class: true, teacher: true } },
      },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async create(dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Subject code already exists');

    return this.prisma.subject.create({ data: dto });
  }

  async update(id: string, dto: UpdateSubjectDto) {
    await this.findOne(id);
    if (dto.code) {
      const existing = await this.prisma.subject.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) throw new ConflictException('Subject code already exists');
    }
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.subject.delete({ where: { id } });
  }
}
