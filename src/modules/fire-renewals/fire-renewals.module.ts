import { Module } from '@nestjs/common';
import { FireRenewalsController } from './fire-renewals.controller';
import { FireRenewalsService } from './fire-renewals.service';

@Module({ controllers: [FireRenewalsController], providers: [FireRenewalsService] })
export class FireRenewalsModule {}
