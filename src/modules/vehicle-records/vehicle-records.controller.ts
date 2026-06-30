import {
  Controller, Get, Post, Put, Delete,
  Param, Body, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehicleRecordsService } from './vehicle-records.service';
import { CreateVehicleRecordDto } from './dto/create-vehicle-record.dto';
import { UpdateVehicleRecordDto } from './dto/update-vehicle-record.dto';

@ApiTags('Vehicle Records')
@ApiBearerAuth()
@Controller('vehicle-records')
export class VehicleRecordsController {
  constructor(private readonly service: VehicleRecordsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vehicle records' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle record by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a vehicle record' })
  create(@Body() dto: CreateVehicleRecordDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a vehicle record' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleRecordDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vehicle record' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
