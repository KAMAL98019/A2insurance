import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateFireRenewalDto {
  @IsInt() @Type(() => Number) fireInsuranceId: number;
  @IsOptional() @IsEnum(['CONTACTED', 'DOCS_COLLECTED', 'PROCESSING', 'PAYMENT_PENDING', 'RENEWED', 'CANCELLED']) status?: string;
  @IsOptional() @IsString() notes?: string;
}
