import { Module } from '@nestjs/common';
import { LabourRenewalsController } from './labour-renewals.controller';
import { LabourRenewalsService } from './labour-renewals.service';
import { AccessControlModule } from '../../common/access-control/access-control.module';

@Module({ imports: [AccessControlModule], controllers: [LabourRenewalsController], providers: [LabourRenewalsService] })
export class LabourRenewalsModule {}
