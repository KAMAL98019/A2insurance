import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsDateString, IsEmail, IsEnum, IsInt, IsNumber,
  IsOptional, IsString, Length, Matches, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FamilyMemberDto,
  HealthCustomerType,
  HealthPaymentMode,
  HealthPolicyStatus,
  HealthPolicyType,
} from './create-health-insurance.dto';

export class UpdateHealthInsuranceDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  locationId?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 100)
  policyNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 150)
  insuranceCompanyName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 100)
  policyHolderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[+\d\s\-()\s]{7,20}$/, { message: 'Invalid mobile number' })
  mobileNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 10)
  gender?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: HealthPolicyType }) @IsOptional() @IsEnum(HealthPolicyType)
  policyType?: HealthPolicyType;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  policyStartDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  policyEndDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  renewalDate?: string;

  @ApiPropertyOptional({ enum: HealthPolicyStatus }) @IsOptional() @IsEnum(HealthPolicyStatus)
  policyStatus?: HealthPolicyStatus;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  sumInsured?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  premiumAmount?: number;

  @ApiPropertyOptional({ enum: HealthPaymentMode }) @IsOptional() @IsEnum(HealthPaymentMode)
  paymentMode?: HealthPaymentMode;

  @ApiPropertyOptional({ enum: HealthCustomerType }) @IsOptional() @IsEnum(HealthCustomerType)
  customerType?: HealthCustomerType;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 100)
  leadSource?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 50)
  renewalReminderStatus?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  remarks?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 100)
  nomineeName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 50)
  nomineeRelationship?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[+\d\s\-()\s]{0,20}$/, { message: 'Invalid nominee mobile number' })
  nomineeMobileNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  policyDocument?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  idProof?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  medicalDocument?: string;

  @ApiPropertyOptional({ type: [FamilyMemberDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberDto)
  familyMembers?: FamilyMemberDto[];
}
