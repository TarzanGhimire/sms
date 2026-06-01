import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeStructureDto, UpdateFeeStructureDto } from './dto/fee-structure.dto';

@Injectable()
export class FeeStructuresService {
  constructor(private prisma: PrismaService) {}

  async findAll(classId?: string) {
    return this.prisma.feeStructure.findMany({
      where: classId ? { classId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        class: { include: { academicYear: { select: { name: true } } } },
        feeCategory: true,
      },
    });
  }

  async findByClass(classId: string) {
    return this.prisma.feeStructure.findMany({
      where: { classId, isActive: true },
      include: { feeCategory: true },
    });
  }

  async create(dto: CreateFeeStructureDto) {
    const existing = await this.prisma.feeStructure.findUnique({
      where: { classId_feeCategoryId: { classId: dto.classId, feeCategoryId: dto.feeCategoryId } },
    });
    if (existing) throw new ConflictException('Fee structure already exists for this class + category');

    return this.prisma.feeStructure.create({
      data: dto,
      include: { class: true, feeCategory: true },
    });
  }

  async update(id: string, dto: UpdateFeeStructureDto) {
    const existing = await this.prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fee structure not found');

    return this.prisma.feeStructure.update({
      where: { id },
      data: dto,
      include: { class: true, feeCategory: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fee structure not found');
    return this.prisma.feeStructure.delete({ where: { id } });
  }
}
