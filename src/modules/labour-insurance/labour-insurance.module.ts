import { Module } from '@nestjs/common';
import { LabourInsuranceController } from './labour-insurance.controller';
import { LabourInsuranceService } from './labour-insurance.service';
import { CloudinaryModule } from '../upload/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [LabourInsuranceController],
  providers: [LabourInsuranceService],
})
export class LabourInsuranceModule {}
