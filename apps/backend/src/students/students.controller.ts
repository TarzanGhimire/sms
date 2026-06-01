import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { StudentsService } from './students.service';
import {
  CreateStudentDto, UpdateStudentDto, QueryStudentsDto, GuardianDto,
} from './dto/student.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('students')
export class StudentsController {
  constructor(private service: StudentsService) {}

  @Get()
  findAll(@Query() query: QueryStudentsDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT)
  @Post(':id/guardians')
  addGuardian(@Param('id') id: string, @Body() dto: GuardianDto) {
    return this.service.addGuardian(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT)
  @Put('guardians/:guardianId')
  updateGuardian(@Param('guardianId') id: string, @Body() dto: Partial<GuardianDto>) {
    return this.service.updateGuardian(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Delete('guardians/:guardianId')
  removeGuardian(@Param('guardianId') id: string) {
    return this.service.removeGuardian(id);
  }
}
