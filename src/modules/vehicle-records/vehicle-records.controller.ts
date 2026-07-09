import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehicleRecordsService } from './vehicle-records.service';
import { CreateVehicleRecordDto } from './dto/create-vehicle-record.dto';
import { UpdateVehicleRecordDto } from './dto/update-vehicle-record.dto';
import { RequireModulePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const MODULE = 'vehicle-records';

@ApiTags('Vehicle Records')
@ApiBearerAuth()
@Controller('vehicle-records')
export class VehicleRecordsController {
  constructor(private readonly service: VehicleRecordsService) {}

  @Get()
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'Get all vehicle records (scoped to caller\'s accessible locations)' })
  findAll(@CurrentUser() user: Express.User, @Query('locationId') locationId?: string) {
    return this.service.findAll(user, locationId ? Number(locationId) : undefined);
  }

  @Get(':id')
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'Get a vehicle record by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequireModulePermission(MODULE, 'create')
  @ApiOperation({ summary: 'Create a vehicle record' })
  create(@Body() dto: CreateVehicleRecordDto, @CurrentUser() user: Express.User) {
    return this.service.create(dto, user);
  }

  @Put(':id')
  @RequireModulePermission(MODULE, 'update')
  @ApiOperation({ summary: 'Update a vehicle record' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleRecordDto, @CurrentUser() user: Express.User) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @RequireModulePermission(MODULE, 'delete')
  @ApiOperation({ summary: 'Delete a vehicle record' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) {
    return this.service.remove(id, user);
  }
}
