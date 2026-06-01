import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SectionsService } from './sections.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sections')
export class SectionsController {
  constructor(private service: SectionsService) {}

  @Get()
  findAll(@Query('classId') classId?: string) {
    return this.service.findAll(classId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Post()
  create(@Body() dto: CreateSectionDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
