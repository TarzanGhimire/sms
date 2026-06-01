import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { Role } from '@prisma/client';
import { FeeCategoriesService } from './fee-categories.service';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from './dto/fee-category.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('fee-categories')
export class FeeCategoriesController {
  constructor(private service: FeeCategoriesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreateFeeCategoryDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFeeCategoryDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
