import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RenewalStatus } from '@prisma/client';

export class UpdateHealthRenewalDto {
  @IsEnum(RenewalStatus)
  @IsOptional()
  status?: RenewalStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
