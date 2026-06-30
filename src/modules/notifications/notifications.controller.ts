import {
  Controller, Get, Post, Put, Body, Query, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendManualDto } from './dto/send-manual.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { IsString } from 'class-validator';

class TestConnectionDto {
  @IsString()
  mobileNumber: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get('whatsapp-status')
  getWhatsAppStatus() {
    return this.svc.getWhatsAppStatus();
  }

  @Post('push-summary')
  pushPolicySummary() {
    return this.svc.pushPolicySummary();
  }

  @Get('whatsapp-qr')
  getWhatsAppQR() {
    return this.svc.getWhatsAppQR();
  }

  @Post('whatsapp-refresh')
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
  testConnection(@Body() dto: TestConnectionDto) {
    return this.svc.testConnection(dto.mobileNumber);
  }
}
