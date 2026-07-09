import { Module } from '@nestjs/common';
import { LabourInsuranceController } from './labour-insurance.controller';
import { LabourInsuranceService } from './labour-insurance.service';
import { CloudinaryModule } from '../upload/cloudinary.module';
import { AccessControlModule } from '../../common/access-control/access-control.module';

@Module({
  imports: [CloudinaryModule, AccessControlModule],
  controllers: [LabourInsuranceController],
  providers: [LabourInsuranceService],
})
export class LabourInsuranceModule {}
