import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FireRenewalsService } from './fire-renewals.service';
import { CreateFireRenewalDto } from './dto/create-fire-renewal.dto';
import { UpdateFireRenewalDto } from './dto/update-fire-renewal.dto';

@ApiTags('Fire Renewals')
@ApiBearerAuth()
@Controller('fire-renewals')
export class FireRenewalsController {
  constructor(private readonly service: FireRenewalsService) {}

  @Get() findAll(@Query('fireInsuranceId') id?: string) { return this.service.findAll(id ? +id : undefined); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateFireRenewalDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFireRenewalDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
