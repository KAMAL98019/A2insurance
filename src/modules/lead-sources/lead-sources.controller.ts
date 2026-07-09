import {
  Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { LeadSourcesService }    from './lead-sources.service';
import { CreateLeadSourceDto }   from './dto/create-lead-source.dto';
import { UpdateLeadSourceDto }   from './dto/update-lead-source.dto';

@Controller('lead-sources')
export class LeadSourcesController {
  constructor(private readonly svc: LeadSourcesService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    return this.svc.findAll(active === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeadSourceDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadSourceDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
