import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, SetSalaryDto } from './dto/staff.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('staff')
export class StaffController {
  constructor(private service: StaffService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Put(':id/salary')
  setSalary(@Param('id') id: string, @Body() dto: SetSalaryDto) {
    return this.service.setSalary(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
