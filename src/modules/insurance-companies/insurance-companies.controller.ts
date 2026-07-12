import {
  Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { InsuranceCompaniesService }  from './insurance-companies.service';
import { CreateInsuranceCompanyDto }  from './dto/create-insurance-company.dto';
import { UpdateInsuranceCompanyDto }  from './dto/update-insurance-company.dto';

@Controller('insurance-companies')
export class InsuranceCompaniesController {
  constructor(private readonly svc: InsuranceCompaniesService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    return this.svc.findAll(active === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @Roles('MASTER_ADMIN', 'SUPER_ADMIN')
  create(@Body() dto: CreateInsuranceCompanyDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @Roles('MASTER_ADMIN', 'SUPER_ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInsuranceCompanyDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles('MASTER_ADMIN', 'SUPER_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
