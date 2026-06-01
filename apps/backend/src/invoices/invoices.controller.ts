import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../pdf/pdf.service';
import {
  CreateInvoiceDto, UpdateInvoiceDto, GenerateMonthlyInvoicesDto, QueryInvoicesDto,
} from './dto/invoice.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private service: InvoicesService,
    private pdf: PdfService,
  ) {}

  @Get()
  findAll(@Query() query: QueryInvoicesDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get(':id/pdf')
  async pdfExport(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.service.findOne(id);
    return this.pdf.invoice(res, invoice);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Post('generate-monthly')
  generateMonthly(@Body() dto: GenerateMonthlyInvoicesDto) {
    return this.service.generateMonthly(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Post('mark-overdue')
  markOverdue() {
    return this.service.markOverdue();
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
