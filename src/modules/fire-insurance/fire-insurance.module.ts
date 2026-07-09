import { Module } from '@nestjs/common';
import { FireInsuranceController } from './fire-insurance.controller';
import { FireInsuranceService } from './fire-insurance.service';
import { CloudinaryModule } from '../upload/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [FireInsuranceController],
  providers: [FireInsuranceService],
})
export class FireInsuranceModule {}
