import { IsOptional, IsString, IsEnum } from 'class-validator';
export class UpdateLabourRenewalDto {
  @IsOptional() @IsEnum(['CONTACTED', 'DOCS_COLLECTED', 'PROCESSING', 'PAYMENT_PENDING', 'RENEWED', 'CANCELLED']) status?: string;
  @IsOptional() @IsString() notes?: string;
}
