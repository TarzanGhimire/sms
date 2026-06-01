import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, QueryExpensesDto } from './dto/expense.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('expenses')
export class ExpensesController {
  constructor(private service: ExpensesService) {}

  @Get()
  findAll(@Query() query: QueryExpensesDto) {
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
  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
