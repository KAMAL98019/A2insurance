import { IsOptional, IsString } from 'class-validator';
export class QueryLabourInsuranceDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() policyStatus?: string;
  @IsOptional() @IsString() customerType?: string;
  @IsOptional() @IsString() renewalDays?: string;
}
