import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(academicYearId?: string) {
    return this.prisma.class.findMany({
      where: academicYearId ? { academicYearId } : undefined,
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        academicYear: { select: { name: true } },
        _count: { select: { sections: true, subjects: true } },
      },
    });
  }

  async findOne(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        academicYear: true,
        sections: { include: { teacher: true } },
        subjects: { include: { subject: true, teacher: true } },
      },
    });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async create(dto: CreateClassDto) {
    const existing = await this.prisma.class.findUnique({
      where: { name_academicYearId: { name: dto.name, academicYearId: dto.academicYearId } },
    });
    if (existing) throw new ConflictException('Class already exists for this academic year');

    return this.prisma.class.create({
      data: {
        name: dto.name,
        academicYearId: dto.academicYearId,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateClassDto) {
    await this.findOne(id);
    return this.prisma.class.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.class.delete({ where: { id } });
  }
}
