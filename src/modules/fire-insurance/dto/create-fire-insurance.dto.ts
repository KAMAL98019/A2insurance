import { IsString, IsOptional, IsEnum, IsDateString, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFireInsuranceDto {
  @IsOptional() @IsInt() locationId?: number;
  @IsString() policyNumber: string;
  @IsString() insuranceCompanyName: string;
  @IsString() insuredName: string;
  @IsString() mobileNumber: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() businessType?: string;
  @IsDateString() policyStartDate: string;
  @IsDateString() policyEndDate: string;
  @IsDateString() renewalDate: string;
  @IsOptional() @IsEnum(['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED']) policyStatus?: string;
  @Type(() => Number) @IsNumber() sumInsured: number;
  @Type(() => Number) @IsNumber() netPremium: number;
  @IsOptional() @Type(() => Number) @IsNumber() cgst?: number;
  @IsOptional() @Type(() => Number) @IsNumber() sgst?: number;
  @IsOptional() @Type(() => Number) @IsNumber() stampDuty?: number;
  @Type(() => Number) @IsNumber() totalPremium: number;
  @IsOptional() @IsString() receiptNumber?: string;
  @IsOptional() @IsDateString() receiptDate?: string;
  @IsOptional() @IsString() agentName?: string;
  @IsOptional() @IsString() agentCode?: string;
  @IsOptional() @IsString() financierName?: string;
  @IsOptional() @IsEnum(['NEW', 'RENEWAL']) customerType?: string;
  @IsOptional() @IsString() leadSource?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsString() policyDocument?: string;
}
