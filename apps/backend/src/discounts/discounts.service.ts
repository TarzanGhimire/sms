import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto, UpdateDiscountDto } from './dto/discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.discount.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const d = await this.prisma.discount.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Discount not found');
    return d;
  }

  create(dto: CreateDiscountDto) {
    return this.prisma.discount.create({ data: dto });
  }

  async update(id: string, dto: UpdateDiscountDto) {
    await this.findOne(id);
    return this.prisma.discount.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.discount.delete({ where: { id } });
  }
}
