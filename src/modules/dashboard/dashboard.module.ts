import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AccessControlModule } from '../../common/access-control/access-control.module';

@Module({
  imports: [AccessControlModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
