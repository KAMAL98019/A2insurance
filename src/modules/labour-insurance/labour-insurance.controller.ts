import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LabourInsuranceService } from './labour-insurance.service';
import { CreateLabourInsuranceDto } from './dto/create-labour-insurance.dto';
import { UpdateLabourInsuranceDto } from './dto/update-labour-insurance.dto';
import { QueryLabourInsuranceDto } from './dto/query-labour-insurance.dto';
import { RequireModulePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const MODULE = 'labour-insurance';

@ApiTags('Labour Insurance')
@ApiBearerAuth()
@Controller('labour-insurance')
export class LabourInsuranceController {
  constructor(private readonly service: LabourInsuranceService) {}

  @Get() @RequireModulePermission(MODULE, 'view')
  findAll(@Query() q: QueryLabourInsuranceDto, @CurrentUser() user: Express.User) { return this.service.findAll(user, q); }

  @Get('stats') @RequireModulePermission(MODULE, 'view')
  getStats(@CurrentUser() user: Express.User) { return this.service.getStats(user); }

  @Get(':id') @RequireModulePermission(MODULE, 'view')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) { return this.service.findOne(id, user); }

  @Post() @RequireModulePermission(MODULE, 'create')
  create(@Body() dto: CreateLabourInsuranceDto, @CurrentUser() user: Express.User) { return this.service.create(dto, user); }

  @Put(':id') @RequireModulePermission(MODULE, 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLabourInsuranceDto, @CurrentUser() user: Express.User) { return this.service.update(id, dto, user); }

  @Delete(':id') @RequireModulePermission(MODULE, 'delete')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Express.User) { return this.service.remove(id, user); }
}
