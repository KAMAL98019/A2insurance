import { Module } from '@nestjs/common';
import { FireInsuranceController } from './fire-insurance.controller';
import { FireInsuranceService } from './fire-insurance.service';
import { CloudinaryModule } from '../upload/cloudinary.module';
import { AccessControlModule } from '../../common/access-control/access-control.module';

@Module({
  imports: [CloudinaryModule, AccessControlModule],
  controllers: [FireInsuranceController],
  providers: [FireInsuranceService],
})
export class FireInsuranceModule {}
