import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LabourRenewalsService } from './labour-renewals.service';
import { CreateLabourRenewalDto } from './dto/create-labour-renewal.dto';
import { UpdateLabourRenewalDto } from './dto/update-labour-renewal.dto';
import { RequireModulePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Renewals aren't a standalone menu item — share the parent module's permission.
const MODULE = 'labour-insurance';

@ApiTags('Labour Renewals')
@ApiBearerAuth()
@Controller('labour-renewals')
export class LabourRenewalsController {
  constructor(private readonly service: LabourRenewalsService) {}

  @Get() @RequireModulePermission(MODULE, 'view')
  findAll(@Query('labourInsuranceId') id: string | undefined, @CurrentUser() user: Express.User) { return this.service.findAll(user, id ? +id : undefined); }

  @Get(':id') @RequireModulePermission(MODULE, 'view')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) { return this.service.findOne(id, user); }

  @Post() @RequireModulePermission(MODULE, 'create')
  create(@Body() dto: CreateLabourRenewalDto, @CurrentUser() user: Express.User) { return this.service.create(dto, user); }

  @Patch(':id') @RequireModulePermission(MODULE, 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLabourRenewalDto, @CurrentUser() user: Express.User) { return this.service.update(id, dto, user); }

  @Delete(':id') @RequireModulePermission(MODULE, 'delete')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) { return this.service.remove(id, user); }
}
