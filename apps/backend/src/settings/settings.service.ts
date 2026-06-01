import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

const SETTINGS_ID = '1';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let settings = await this.prisma.schoolSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (!settings) {
      settings = await this.prisma.schoolSettings.create({
        data: { id: SETTINGS_ID, schoolName: 'My School' },
      });
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto) {
    await this.get(); // ensure exists
    return this.prisma.schoolSettings.update({
      where: { id: SETTINGS_ID },
      data: dto,
    });
  }
}
