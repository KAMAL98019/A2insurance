import { Controller, Get, Post, Put, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('Locations')
@ApiBearerAuth()
@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List locations (Master Admin and Super Admin see all — oversight; Admin Users see only their assigned ones)' })
  findAll(@CurrentUser() user: Express.User) {
    return this.service.findAll(user);
  }

  @Post()
  @Roles('MASTER_ADMIN')
  @ApiOperation({ summary: 'Create a location (Master Admin only)' })
  create(@Body() dto: CreateLocationDto, @CurrentUser() user: Express.User) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  @Roles('MASTER_ADMIN')
  @ApiOperation({ summary: 'Update a location (Master Admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLocationDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('MASTER_ADMIN')
  @ApiOperation({ summary: 'Deactivate a location (Master Admin only)' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles('MASTER_ADMIN')
  @ApiOperation({ summary: 'Reactivate a deactivated location (Master Admin only)' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.service.activate(id);
  }

  @Delete(':id')
  @Roles('MASTER_ADMIN')
  @ApiOperation({ summary: 'Permanently delete a location (Master Admin only, blocked if it still has data or assigned users)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/assign-super-admin/:superAdminId')
  @Roles('MASTER_ADMIN')
  @ApiOperation({ summary: 'Assign a Super Admin to this location (Master Admin only)' })
  assignSuperAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Param('superAdminId', ParseIntPipe) superAdminId: number,
    @CurrentUser() user: Express.User,
  ) {
    return this.service.assignSuperAdmin(id, superAdminId, user.id);
  }
}
