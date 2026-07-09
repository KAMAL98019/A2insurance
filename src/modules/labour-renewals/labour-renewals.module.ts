import { Module } from '@nestjs/common';
import { LabourRenewalsController } from './labour-renewals.controller';
import { LabourRenewalsService } from './labour-renewals.service';

@Module({ controllers: [LabourRenewalsController], providers: [LabourRenewalsService] })
export class LabourRenewalsModule {}
