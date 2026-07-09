import { Module } from '@nestjs/common';
import { HealthInsuranceService } from './health-insurance.service';
import { HealthInsuranceController } from './health-insurance.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [HealthInsuranceController],
  providers: [HealthInsuranceService],
  exports: [HealthInsuranceService],
})
export class HealthInsuranceModule {}
