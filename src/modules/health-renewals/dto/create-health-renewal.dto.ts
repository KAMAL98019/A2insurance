import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { RenewalStatus } from '@prisma/client';

export class CreateHealthRenewalDto {
  @IsInt()
  @Type(() => Number)
  healthInsuranceId: number;

  @IsEnum(RenewalStatus)
  @IsOptional()
  status?: RenewalStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
