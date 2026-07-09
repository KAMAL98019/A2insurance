import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HealthRenewalsService } from './health-renewals.service';
import { CreateHealthRenewalDto } from './dto/create-health-renewal.dto';
import { UpdateHealthRenewalDto } from './dto/update-health-renewal.dto';

@ApiTags('Health Renewals')
@ApiBearerAuth()
@Controller('health-renewals')
export class HealthRenewalsController {
  constructor(private readonly service: HealthRenewalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all health renewals (optionally filter by healthInsuranceId)' })
  findAll(@Query('healthInsuranceId') healthInsuranceId?: string) {
    return this.service.findAll(healthInsuranceId ? +healthInsuranceId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single health renewal entry' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Start tracking a renewal for a health insurance policy' })
  create(@Body() dto: CreateHealthRenewalDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update health renewal status / notes' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHealthRenewalDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a health renewal tracking entry' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
