import { Module } from '@nestjs/common';
import { VehicleRecordsService } from './vehicle-records.service';
import { VehicleRecordsController } from './vehicle-records.controller';

@Module({
  controllers: [VehicleRecordsController],
  providers: [VehicleRecordsService],
})
export class VehicleRecordsModule {}
