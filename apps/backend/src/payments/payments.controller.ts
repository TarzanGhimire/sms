import { Controller, Get, Post, Param, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PdfService } from '../pdf/pdf.service';
import { CreatePaymentDto, QueryPaymentsDto } from './dto/payment.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(
    private service: PaymentsService,
    private pdf: PdfService,
  ) {}

  @Get()
  findAll(@Query() query: QueryPaymentsDto) {
    return this.service.findAll(query);
  }

  @Get('daily-collection')
  dailyCollection(@Query('date') date?: string) {
    return this.service.dailyCollection(date);
  }

  @Get(':id/pdf')
  async pdfReceipt(@Param('id') id: string, @Res() res: Response) {
    const payment = await this.service.findOne(id);
    return this.pdf.receipt(res, payment);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.service.create(dto);
  }
}
