import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LabourInsuranceService } from './labour-insurance.service';
import { CreateLabourInsuranceDto } from './dto/create-labour-insurance.dto';
import { UpdateLabourInsuranceDto } from './dto/update-labour-insurance.dto';
import { QueryLabourInsuranceDto } from './dto/query-labour-insurance.dto';

@ApiTags('Labour Insurance')
@ApiBearerAuth()
@Controller('labour-insurance')
export class LabourInsuranceController {
  constructor(private readonly service: LabourInsuranceService) {}

  @Get() findAll(@Query() q: QueryLabourInsuranceDto) { return this.service.findAll(q); }
  @Get('stats') getStats() { return this.service.getStats(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateLabourInsuranceDto) { return this.service.create(dto); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLabourInsuranceDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
