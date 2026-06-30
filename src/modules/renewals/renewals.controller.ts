import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RenewalsService } from './renewals.service';
import { CreateRenewalDto } from './dto/create-renewal.dto';
import { UpdateRenewalDto } from './dto/update-renewal.dto';

@ApiTags('Renewals')
@ApiBearerAuth()
@Controller('renewals')
export class RenewalsController {
  constructor(private readonly service: RenewalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all renewals (optionally filter by vehicleRecordId)' })
  findAll(@Query('vehicleRecordId') vehicleRecordId?: string) {
    return this.service.findAll(vehicleRecordId ? +vehicleRecordId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single renewal entry' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Start tracking a renewal for a vehicle' })
  create(@Body() dto: CreateRenewalDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update renewal status / notes' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRenewalDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a renewal tracking entry' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
