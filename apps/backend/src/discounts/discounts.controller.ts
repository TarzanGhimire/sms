import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, UpdateDiscountDto } from './dto/discount.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('discounts')
export class DiscountsController {
  constructor(private service: DiscountsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreateDiscountDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
