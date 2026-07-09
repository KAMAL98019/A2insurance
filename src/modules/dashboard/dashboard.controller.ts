import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (scoped to the caller\'s accessible locations)' })
  @ApiQuery({ name: 'locationId', required: false, description: 'Filter to a single location' })
  getStats(@CurrentUser() user: Express.User, @Query('locationId') locationId?: string) {
    return this.service.getStats(user, locationId ? Number(locationId) : undefined);
  }
}
