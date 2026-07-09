import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FireInsuranceService } from './fire-insurance.service';
import { CreateFireInsuranceDto } from './dto/create-fire-insurance.dto';
import { UpdateFireInsuranceDto } from './dto/update-fire-insurance.dto';
import { QueryFireInsuranceDto } from './dto/query-fire-insurance.dto';

@ApiTags('Fire Insurance')
@ApiBearerAuth()
@Controller('fire-insurance')
export class FireInsuranceController {
  constructor(private readonly service: FireInsuranceService) {}

  @Get() findAll(@Query() q: QueryFireInsuranceDto) { return this.service.findAll(q); }
  @Get('stats') getStats() { return this.service.getStats(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateFireInsuranceDto) { return this.service.create(dto); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFireInsuranceDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
