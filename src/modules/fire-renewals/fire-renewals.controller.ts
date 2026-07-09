import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FireRenewalsService } from './fire-renewals.service';
import { CreateFireRenewalDto } from './dto/create-fire-renewal.dto';
import { UpdateFireRenewalDto } from './dto/update-fire-renewal.dto';
import { RequireModulePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Renewals aren't a standalone menu item — share the parent module's permission.
const MODULE = 'fire-insurance';

@ApiTags('Fire Renewals')
@ApiBearerAuth()
@Controller('fire-renewals')
export class FireRenewalsController {
  constructor(private readonly service: FireRenewalsService) {}

  @Get() @RequireModulePermission(MODULE, 'view')
  findAll(@Query('fireInsuranceId') id: string | undefined, @CurrentUser() user: Express.User) { return this.service.findAll(user, id ? +id : undefined); }

  @Get(':id') @RequireModulePermission(MODULE, 'view')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) { return this.service.findOne(id, user); }

  @Post() @RequireModulePermission(MODULE, 'create')
  create(@Body() dto: CreateFireRenewalDto, @CurrentUser() user: Express.User) { return this.service.create(dto, user); }

  @Patch(':id') @RequireModulePermission(MODULE, 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFireRenewalDto, @CurrentUser() user: Express.User) { return this.service.update(id, dto, user); }

  @Delete(':id') @RequireModulePermission(MODULE, 'delete')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) { return this.service.remove(id, user); }
}
