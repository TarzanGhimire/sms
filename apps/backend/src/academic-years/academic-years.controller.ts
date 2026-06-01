import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic-year.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('academic-years')
export class AcademicYearsController {
  constructor(private service: AcademicYearsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('current')
  findCurrent() {
    return this.service.findCurrent();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Post()
  create(@Body() dto: CreateAcademicYearDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAcademicYearDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
