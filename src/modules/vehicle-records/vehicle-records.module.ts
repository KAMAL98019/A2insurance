import { Module } from '@nestjs/common';
import { VehicleRecordsService } from './vehicle-records.service';
import { VehicleRecordsController } from './vehicle-records.controller';
import { AccessControlModule } from '../../common/access-control/access-control.module';

@Module({
  imports: [AccessControlModule],
  controllers: [VehicleRecordsController],
  providers: [VehicleRecordsService],
})
export class VehicleRecordsModule {}
