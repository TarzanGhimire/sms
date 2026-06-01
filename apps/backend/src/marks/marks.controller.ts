import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { MarksService } from './marks.service';
import { PdfService } from '../pdf/pdf.service';
import { BulkMarksDto } from './dto/mark.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('marks')
export class MarksController {
  constructor(
    private service: MarksService,
    private pdf: PdfService,
  ) {}

  @Get('entry-grid')
  getEntryGrid(@Query('examId') examId: string, @Query('sectionId') sectionId: string) {
    return this.service.getEntryGrid(examId, sectionId);
  }

  @Get('results')
  getSectionResults(@Query('examId') examId: string, @Query('sectionId') sectionId: string) {
    return this.service.getSectionResults(examId, sectionId);
  }

  @Get('report-card')
  getReportCard(@Query('examId') examId: string, @Query('studentId') studentId: string) {
    return this.service.getStudentReportCard(examId, studentId);
  }

  @Get('report-card/pdf')
  async reportCardPdf(
    @Query('examId') examId: string,
    @Query('studentId') studentId: string,
    @Res() res: Response,
  ) {
    const card = await this.service.getStudentReportCard(examId, studentId);
    return this.pdf.reportCard(res, card);
  }

  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL, Role.TEACHER)
  @Post('bulk')
  bulkUpsert(@Body() dto: BulkMarksDto) {
    return this.service.bulkUpsert(dto);
  }
}
