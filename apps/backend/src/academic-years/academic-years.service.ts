import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { classes: true } } },
    });
  }

  async findCurrent() {
    return this.prisma.academicYear.findFirst({ where: { isCurrent: true } });
  }

  async findOne(id: string) {
    const year = await this.prisma.academicYear.findUnique({ where: { id } });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async create(dto: CreateAcademicYearDto) {
    const existing = await this.prisma.academicYear.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Academic year with this name already exists');

    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateAcademicYearDto) {
    await this.findOne(id);

    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { isCurrent: true, NOT: { id } },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isCurrent !== undefined && { isCurrent: dto.isCurrent }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.academicYear.delete({ where: { id } });
  }
}
