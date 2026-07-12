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
import { RequireModulePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const MODULE = 'health-insurance';

@ApiTags('Health Insurance')
@ApiBearerAuth()
@Controller('health-insurance')
export class HealthInsuranceController {
  constructor(private readonly service: HealthInsuranceService) {}

  @Get()
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'Get all health insurance records (with optional search/filter)' })
  findAll(@Query() query: QueryHealthInsuranceDto, @CurrentUser() user: Express.User) {
    return this.service.findAll(user, query);
  }

  @Get('stats')
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'Get health insurance dashboard stats' })
  getStats(@CurrentUser() user: Express.User, @Query('locationId') locationId?: string) {
    return this.service.getStats(user, locationId ? Number(locationId) : undefined);
  }

  @Get('upcoming-renewals')
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'Get policies with upcoming renewals' })
  @ApiQuery({ name: 'days', required: false, description: 'Look-ahead days (default 30)' })
  getUpcomingRenewals(@Query('days') days: string | undefined, @CurrentUser() user: Express.User) {
    return this.service.getUpcomingRenewals(user, days ? parseInt(days, 10) : 30);
  }

  @Get(':id')
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'Get a health insurance record by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequireModulePermission(MODULE, 'create')
  @ApiOperation({ summary: 'Create a health insurance record' })
  create(@Body() dto: CreateHealthInsuranceDto, @CurrentUser() user: Express.User) {
    return this.service.create(dto, user);
  }

  @Put(':id')
  @RequireModulePermission(MODULE, 'update')
  @ApiOperation({ summary: 'Update a health insurance record' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHealthInsuranceDto, @CurrentUser() user: Express.User) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @RequireModulePermission(MODULE, 'delete')
  @ApiOperation({ summary: 'Delete a health insurance record' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) {
    return this.service.remove(id, user);
  }

  @Post(':id/send-whatsapp')
  @RequireModulePermission(MODULE, 'update')
  @ApiOperation({ summary: 'Send WhatsApp renewal reminder for a health insurance record' })
  sendWhatsApp(@Param('id', ParseIntPipe) id: number, @Body() dto: SendWhatsAppDto, @CurrentUser() user: Express.User) {
    return this.service.sendWhatsApp(id, user, dto.message);
  }
}
