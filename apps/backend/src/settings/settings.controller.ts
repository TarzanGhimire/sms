import { Controller, Get, Put, Body } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

  // Public so login/branding can be shown before auth
  @Public()
  @Get()
  get() {
    return this.service.get();
  }

  @Roles(Role.SUPER_ADMIN)
  @Put()
  update(@Body() dto: UpdateSettingsDto) {
    return this.service.update(dto);
  }
}
