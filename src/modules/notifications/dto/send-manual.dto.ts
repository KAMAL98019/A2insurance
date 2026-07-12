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

  @IsOptional()
  @IsInt()
  @IsPositive()
  healthInsuranceId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  fireInsuranceId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  labourInsuranceId?: number;
}
