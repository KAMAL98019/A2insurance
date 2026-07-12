import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FireInsuranceService } from './fire-insurance.service';
import { CreateFireInsuranceDto } from './dto/create-fire-insurance.dto';
import { UpdateFireInsuranceDto } from './dto/update-fire-insurance.dto';
import { QueryFireInsuranceDto } from './dto/query-fire-insurance.dto';
import { RequireModulePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const MODULE = 'fire-insurance';

@ApiTags('Fire Insurance')
@ApiBearerAuth()
@Controller('fire-insurance')
export class FireInsuranceController {
  constructor(private readonly service: FireInsuranceService) {}

  @Get() @RequireModulePermission(MODULE, 'view')
  findAll(@Query() q: QueryFireInsuranceDto, @CurrentUser() user: Express.User) { return this.service.findAll(user, q); }

  @Get('stats') @RequireModulePermission(MODULE, 'view')
  getStats(@CurrentUser() user: Express.User, @Query('locationId') locationId?: string) {
    return this.service.getStats(user, locationId ? Number(locationId) : undefined);
  }

  @Get(':id') @RequireModulePermission(MODULE, 'view')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) { return this.service.findOne(id, user); }

  @Post() @RequireModulePermission(MODULE, 'create')
  create(@Body() dto: CreateFireInsuranceDto, @CurrentUser() user: Express.User) { return this.service.create(dto, user); }

  @Put(':id') @RequireModulePermission(MODULE, 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFireInsuranceDto, @CurrentUser() user: Express.User) { return this.service.update(id, dto, user); }

  @Delete(':id') @RequireModulePermission(MODULE, 'delete')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) { return this.service.remove(id, user); }
}
