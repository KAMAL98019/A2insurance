import {
  Controller, Get, Post, Put, Body, Query, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendManualDto } from './dto/send-manual.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { IsString } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator';

class TestConnectionDto {
  @IsString()
  mobileNumber: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  // WhatsApp connect/scan is Super Admin only — they run day-to-day org
  // operations and hold the phone that gets linked.
  @Get('whatsapp-status')
  @Roles('SUPER_ADMIN')
  getWhatsAppStatus() {
    return this.svc.getWhatsAppStatus();
  }

  @Post('push-summary')
  pushPolicySummary() {
    return this.svc.pushPolicySummary();
  }

  @Get('whatsapp-qr')
  @Roles('SUPER_ADMIN')
  getWhatsAppQR() {
    return this.svc.getWhatsAppQR();
  }

  @Post('whatsapp-refresh')
  @Roles('SUPER_ADMIN')
  refreshWhatsAppQR() {
    return this.svc.refreshWhatsAppQR();
  }

  @Get('settings')
  getSettings() {
    return this.svc.getSettings();
  }

  @Put('settings')
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.svc.updateSettings(dto);
  }

  @Get('logs')
  getLogs(@Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number) {
    return this.svc.getLogs(limit);
  }

  @Get('stats')
  getStats() {
    return this.svc.getLogStats();
  }

  @Post('send-manual')
  sendManual(@Body() dto: SendManualDto) {
    return this.svc.sendManual(dto);
  }

  @Post('test')
  @Roles('SUPER_ADMIN')
  testConnection(@Body() dto: TestConnectionDto) {
    return this.svc.testConnection(dto.mobileNumber);
  }
}
