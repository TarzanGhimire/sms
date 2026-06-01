import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClassSubjectsService } from './class-subjects.service';
import { CreateClassSubjectDto, UpdateClassSubjectDto } from './dto/class-subject.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('class-subjects')
export class ClassSubjectsController {
  constructor(private service: ClassSubjectsService) {}

  @Get()
  findAll(@Query('classId') classId?: string) {
    return this.service.findAll(classId);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Post()
  create(@Body() dto: CreateClassSubjectDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassSubjectDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
