import { Module } from '@nestjs/common';
import { HealthRenewalsService } from './health-renewals.service';
import { HealthRenewalsController } from './health-renewals.controller';

@Module({
  controllers: [HealthRenewalsController],
  providers:   [HealthRenewalsService],
  exports:     [HealthRenewalsService],
})
export class HealthRenewalsModule {}
