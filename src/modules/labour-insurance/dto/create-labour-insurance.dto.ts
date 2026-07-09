import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLabourInsuranceDto {
  @IsOptional() @IsInt() locationId?: number;
  @IsString() policyNumber: string;
  @IsString() insuranceCompanyName: string;
  @IsString() insuredName: string;
  @IsString() mobileNumber: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() businessDescription?: string;
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() intermediaryCode?: string;
  @IsOptional() @IsString() intermediaryName?: string;
  @IsDateString() policyStartDate: string;
  @IsDateString() policyEndDate: string;
  @IsDateString() renewalDate: string;
  @IsOptional() @IsEnum(['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED']) policyStatus?: string;
  @IsOptional() @Type(() => Number) @IsInt() numberOfEmployees?: number;
  @IsOptional() @Type(() => Number) @IsNumber() wagesPerEmployee?: number;
  @IsOptional() @Type(() => Number) @IsNumber() totalDeclaredWages?: number;
  @Type(() => Number) @IsNumber() premium: number;
  @IsOptional() @Type(() => Number) @IsNumber() cgst?: number;
  @IsOptional() @Type(() => Number) @IsNumber() sgst?: number;
  @Type(() => Number) @IsNumber() totalPremium: number;
  @IsOptional() @IsString() receiptNumber?: string;
  @IsOptional() @IsDateString() receiptDate?: string;
  @IsOptional() @IsEnum(['UNNAMED', 'NAMED']) labourPolicyType?: string;
  @IsOptional() @IsEnum(['NEW', 'RENEWAL']) customerType?: string;
  @IsOptional() @IsString() leadSource?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsString() policyDocument?: string;
}
