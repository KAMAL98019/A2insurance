import { Module } from '@nestjs/common';
import { FireRenewalsController } from './fire-renewals.controller';
import { FireRenewalsService } from './fire-renewals.service';
import { AccessControlModule } from '../../common/access-control/access-control.module';

@Module({ imports: [AccessControlModule], controllers: [FireRenewalsController], providers: [FireRenewalsService] })
export class FireRenewalsModule {}
