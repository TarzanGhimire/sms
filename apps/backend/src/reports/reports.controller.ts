import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@Roles(Role.SUPER_ADMIN, Role.PRINCIPAL, Role.ACCOUNTANT)
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('financial-overview')
  financialOverview(@Query('month') month?: string, @Query('year') year?: string) {
    return this.service.financialOverview(month ? +month : undefined, year ? +year : undefined);
  }

  @Get('monthly-trend')
  monthlyTrend(@Query('year') year?: string) {
    return this.service.monthlyTrend(year ? +year : undefined);
  }

  @Get('outstanding-by-class')
  outstandingByClass() {
    return this.service.outstandingByClass();
  }
}
