import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('classes')
export class ClassesController {
  constructor(private service: ClassesService) {}

  @Get()
  findAll(@Query('academicYearId') academicYearId?: string) {
    return this.service.findAll(academicYearId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Post()
  create(@Body() dto: CreateClassDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
