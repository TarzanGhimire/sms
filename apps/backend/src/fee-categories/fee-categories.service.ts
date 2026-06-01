import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from './dto/fee-category.dto';

@Injectable()
export class FeeCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.feeCategory.findMany({
      orderBy: [{ feeType: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { feeStructures: true } } },
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.feeCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Fee category not found');
    return cat;
  }

  async create(dto: CreateFeeCategoryDto) {
    const existing = await this.prisma.feeCategory.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Fee category already exists');
    return this.prisma.feeCategory.create({ data: dto });
  }

  async update(id: string, dto: UpdateFeeCategoryDto) {
    await this.findOne(id);
    return this.prisma.feeCategory.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.feeCategory.delete({ where: { id } });
  }
}
