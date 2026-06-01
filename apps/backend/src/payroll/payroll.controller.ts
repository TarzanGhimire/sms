import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto, UpdatePayrollDto, QueryPayrollDto } from './dto/payroll.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payroll')
export class PayrollController {
  constructor(private service: PayrollService) {}

  @Get()
  findAll(@Query() query: QueryPayrollDto) {
    return this.service.findAll(query);
  }

  @Get('summary')
  summary(@Query('month') month?: string, @Query('year') year?: string) {
    return this.service.summary(month ? +month : undefined, year ? +year : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Post('generate-monthly')
  generateMonthly(@Body() dto: GeneratePayrollDto) {
    return this.service.generateMonthly(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePayrollDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Put(':id/mark-paid')
  markPaid(@Param('id') id: string) {
    return this.service.markPaid(id);
  }
}
