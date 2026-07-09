import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HealthRenewalsService } from './health-renewals.service';
import { CreateHealthRenewalDto } from './dto/create-health-renewal.dto';
import { UpdateHealthRenewalDto } from './dto/update-health-renewal.dto';
import { RequireModulePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const MODULE = 'health-renewals';

@ApiTags('Health Renewals')
@ApiBearerAuth()
@Controller('health-renewals')
export class HealthRenewalsController {
  constructor(private readonly service: HealthRenewalsService) {}

  @Get()
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'List all health renewals (optionally filter by healthInsuranceId)' })
  findAll(@Query('healthInsuranceId') healthInsuranceId: string | undefined, @CurrentUser() user: Express.User) {
    return this.service.findAll(user, healthInsuranceId ? +healthInsuranceId : undefined);
  }

  @Get(':id')
  @RequireModulePermission(MODULE, 'view')
  @ApiOperation({ summary: 'Get a single health renewal entry' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequireModulePermission(MODULE, 'create')
  @ApiOperation({ summary: 'Start tracking a renewal for a health insurance policy' })
  create(@Body() dto: CreateHealthRenewalDto, @CurrentUser() user: Express.User) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequireModulePermission(MODULE, 'update')
  @ApiOperation({ summary: 'Update health renewal status / notes' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHealthRenewalDto,
    @CurrentUser() user: Express.User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @RequireModulePermission(MODULE, 'delete')
  @ApiOperation({ summary: 'Remove a health renewal tracking entry' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) {
    return this.service.remove(id, user);
  }
}
