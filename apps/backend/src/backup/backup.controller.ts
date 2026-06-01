import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { BackupService } from './backup.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('backup')
@Roles(Role.SUPER_ADMIN)
export class BackupController {
  constructor(private service: BackupService) {}

  @Get('export')
  async export(@Res() res: Response) {
    const data = await this.service.exportData();
    const filename = `school-erp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }
}
