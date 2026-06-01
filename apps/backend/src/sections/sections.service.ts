import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(classId?: string) {
    return this.prisma.section.findMany({
      where: classId ? { classId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        class: { include: { academicYear: { select: { name: true } } } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
    });
  }

  async findOne(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        class: { include: { academicYear: true } },
        teacher: true,
        students: { where: { status: 'ACTIVE' } },
      },
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async create(dto: CreateSectionDto) {
    const existing = await this.prisma.section.findUnique({
      where: { name_classId: { name: dto.name, classId: dto.classId } },
    });
    if (existing) throw new ConflictException('Section already exists in this class');

    return this.prisma.section.create({
      data: dto,
      include: { class: true, teacher: true },
    });
  }

  async update(id: string, dto: UpdateSectionDto) {
    await this.findOne(id);
    return this.prisma.section.update({
      where: { id },
      data: dto,
      include: { class: true, teacher: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.section.delete({ where: { id } });
  }
}
