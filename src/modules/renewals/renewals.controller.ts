import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RenewalsService } from './renewals.service';
import { CreateRenewalDto } from './dto/create-renewal.dto';
import { UpdateRenewalDto } from './dto/update-renewal.dto';
import { RequireModulePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const MODULE = 'renewals';

@ApiTags('Renewals')
@ApiBearerAuth()
@Controller('renewals')
export class RenewalsController {
  constructor(private readonly service: RenewalsService) {}

  @Get()
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'List all renewals (optionally filter by vehicleRecordId)' })
  findAll(@Query('vehicleRecordId') vehicleRecordId: string | undefined, @CurrentUser() user: Express.User) {
    return this.service.findAll(user, vehicleRecordId ? +vehicleRecordId : undefined);
  }

  @Get(':id')
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'Get a single renewal entry' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequireModulePermission(MODULE, 'create')
  @ApiOperation({ summary: 'Start tracking a renewal for a vehicle' })
  create(@Body() dto: CreateRenewalDto, @CurrentUser() user: Express.User) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequireModulePermission(MODULE, 'update')
  @ApiOperation({ summary: 'Update renewal status / notes' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRenewalDto,
    @CurrentUser() user: Express.User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @RequireModulePermission(MODULE, 'delete')
  @ApiOperation({ summary: 'Remove a renewal tracking entry' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) {
    return this.service.remove(id, user);
  }
}
