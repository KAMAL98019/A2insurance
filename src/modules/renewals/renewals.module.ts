import { Module } from '@nestjs/common';
import { RenewalsController } from './renewals.controller';
import { RenewalsService } from './renewals.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccessControlModule } from '../../common/access-control/access-control.module';

@Module({
  imports: [PrismaModule, AccessControlModule],
  controllers: [RenewalsController],
  providers: [RenewalsService],
})
export class RenewalsModule {}
