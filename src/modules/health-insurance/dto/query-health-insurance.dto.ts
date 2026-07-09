import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { HealthCustomerType, HealthPolicyStatus, HealthPolicyType } from './create-health-insurance.dto';

export class QueryHealthInsuranceDto {
  @ApiPropertyOptional() @IsOptional() @IsNumberString()
  locationId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: HealthPolicyStatus }) @IsOptional() @IsEnum(HealthPolicyStatus)
  policyStatus?: HealthPolicyStatus;

  @ApiPropertyOptional({ enum: HealthPolicyType }) @IsOptional() @IsEnum(HealthPolicyType)
  policyType?: HealthPolicyType;

  @ApiPropertyOptional({ enum: HealthCustomerType }) @IsOptional() @IsEnum(HealthCustomerType)
  customerType?: HealthCustomerType;

  @ApiPropertyOptional() @IsOptional() @IsString()
  insuranceCompanyName?: string;

  @ApiPropertyOptional({ description: 'Upcoming renewals within N days (default 30)' })
  @IsOptional()
  @IsNumberString()
  renewalDays?: string;
}
