import { Module } from '@nestjs/common';
import { HealthRenewalsService } from './health-renewals.service';
import { HealthRenewalsController } from './health-renewals.controller';
import { AccessControlModule } from '../../common/access-control/access-control.module';

@Module({
  imports:     [AccessControlModule],
  controllers: [HealthRenewalsController],
  providers:   [HealthRenewalsService],
  exports:     [HealthRenewalsService],
})
export class HealthRenewalsModule {}
