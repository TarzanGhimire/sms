import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto, UpdateFeeStructureDto } from './dto/fee-structure.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('fee-structures')
export class FeeStructuresController {
  constructor(private service: FeeStructuresService) {}

  @Get()
  findAll(@Query('classId') classId?: string) {
    return this.service.findAll(classId);
  }

  @Get('by-class/:classId')
  findByClass(@Param('classId') classId: string) {
    return this.service.findByClass(classId);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreateFeeStructureDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFeeStructureDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
