import { Module } from '@nestjs/common';
import { HealthInsuranceService } from './health-insurance.service';
import { HealthInsuranceController } from './health-insurance.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccessControlModule } from '../../common/access-control/access-control.module';

@Module({
  imports: [NotificationsModule, AccessControlModule],
  controllers: [HealthInsuranceController],
  providers: [HealthInsuranceService],
  exports: [HealthInsuranceService],
})
export class HealthInsuranceModule {}
