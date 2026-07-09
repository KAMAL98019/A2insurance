import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, ParseIntPipe,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

class SendWhatsAppDto {
  @IsOptional()
  @IsString()
  message?: string;
}
import { HealthInsuranceService } from './health-insurance.service';
import { CreateHealthInsuranceDto } from './dto/create-health-insurance.dto';
import { UpdateHealthInsuranceDto } from './dto/update-health-insurance.dto';
import { QueryHealthInsuranceDto } from './dto/query-health-insurance.dto';

@ApiTags('Health Insurance')
@ApiBearerAuth()
@Controller('health-insurance')
export class HealthInsuranceController {
  constructor(private readonly service: HealthInsuranceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all health insurance records (with optional search/filter)' })
  findAll(@Query() query: QueryHealthInsuranceDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get health insurance dashboard stats' })
  getStats() {
    return this.service.getStats();
  }

  @Get('upcoming-renewals')
  @ApiOperation({ summary: 'Get policies with upcoming renewals' })
  @ApiQuery({ name: 'days', required: false, description: 'Look-ahead days (default 30)' })
  getUpcomingRenewals(@Query('days') days?: string) {
    return this.service.getUpcomingRenewals(days ? parseInt(days, 10) : 30);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a health insurance record by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a health insurance record' })
  create(@Body() dto: CreateHealthInsuranceDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a health insurance record' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHealthInsuranceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a health insurance record' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/send-whatsapp')
  @ApiOperation({ summary: 'Send WhatsApp renewal reminder for a health insurance record' })
  sendWhatsApp(@Param('id', ParseIntPipe) id: number, @Body() dto: SendWhatsAppDto) {
    return this.service.sendWhatsApp(id, dto.message);
  }
}
