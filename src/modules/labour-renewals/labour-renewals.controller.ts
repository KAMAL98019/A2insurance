import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LabourRenewalsService } from './labour-renewals.service';
import { CreateLabourRenewalDto } from './dto/create-labour-renewal.dto';
import { UpdateLabourRenewalDto } from './dto/update-labour-renewal.dto';

@ApiTags('Labour Renewals')
@ApiBearerAuth()
@Controller('labour-renewals')
export class LabourRenewalsController {
  constructor(private readonly service: LabourRenewalsService) {}

  @Get() findAll(@Query('labourInsuranceId') id?: string) { return this.service.findAll(id ? +id : undefined); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateLabourRenewalDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLabourRenewalDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
