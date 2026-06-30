import { IsString, IsOptional, IsInt, IsPositive } from 'class-validator';

export class SendManualDto {
  @IsString()
  mobileNumber: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  vehicleRecordId?: number;
}
