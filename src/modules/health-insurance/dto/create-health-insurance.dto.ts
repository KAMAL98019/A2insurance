import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional,
  IsString, Length, Matches, Min, ValidateNested, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum HealthPolicyType {
  INDIVIDUAL       = 'INDIVIDUAL',
  FAMILY_FLOATER   = 'FAMILY_FLOATER',
  SENIOR_CITIZEN   = 'SENIOR_CITIZEN',
  GROUP_INSURANCE  = 'GROUP_INSURANCE',
  CRITICAL_ILLNESS = 'CRITICAL_ILLNESS',
}

export enum HealthPolicyStatus {
  ACTIVE          = 'ACTIVE',
  EXPIRED         = 'EXPIRED',
  PENDING_RENEWAL = 'PENDING_RENEWAL',
  CANCELLED       = 'CANCELLED',
}

export enum HealthPaymentMode {
  CASH          = 'CASH',
  UPI           = 'UPI',
  CARD          = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum HealthCustomerType {
  NEW     = 'NEW',
  RENEWAL = 'RENEWAL',
}

export class FamilyMemberDto {
  @ApiProperty({ example: 'Priya Kumar' })
  @IsString()
  @Length(2, 100)
  memberName: string;

  @ApiProperty({ example: 'Spouse' })
  @IsString()
  @Length(1, 50)
  relationship: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Female' })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 255)
  preExistingDisease?: string;
}

export class CreateHealthInsuranceDto {
  @ApiPropertyOptional({ example: 1, description: 'Defaults to the caller\'s primary location if omitted' })
  @IsOptional()
  @IsInt()
  locationId?: number;

  // ── Basic Policy Details ────────────────────────────────────────────────────

  @ApiProperty({ example: 'HDFC-2024-001' })
  @IsString()
  @Length(1, 100)
  policyNumber: string;

  @ApiProperty({ example: 'HDFC Ergo' })
  @IsString()
  @Length(2, 150)
  insuranceCompanyName: string;

  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  @Length(2, 100)
  policyHolderName: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[+\d\s\-()\s]{7,20}$/, { message: 'Invalid mobile number' })
  mobileNumber: string;

  @ApiPropertyOptional({ example: 'rajesh@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1985-06-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: HealthPolicyType })
  @IsEnum(HealthPolicyType)
  policyType: HealthPolicyType;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  policyStartDate: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString()
  policyEndDate: string;

  @ApiProperty({ example: '2024-12-01' })
  @IsDateString()
  renewalDate: string;

  @ApiPropertyOptional({ enum: HealthPolicyStatus, default: HealthPolicyStatus.ACTIVE })
  @IsOptional()
  @IsEnum(HealthPolicyStatus)
  policyStatus?: HealthPolicyStatus;

  // ── Coverage & Payment ──────────────────────────────────────────────────────

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  sumInsured: number;

  @ApiProperty({ example: 12000 })
  @IsNumber()
  @Min(0)
  premiumAmount: number;

  @ApiPropertyOptional({ enum: HealthPaymentMode })
  @IsOptional()
  @IsEnum(HealthPaymentMode)
  paymentMode?: HealthPaymentMode;

  @ApiPropertyOptional({ enum: HealthCustomerType, default: HealthCustomerType.NEW })
  @IsOptional()
  @IsEnum(HealthCustomerType)
  customerType?: HealthCustomerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  leadSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 50)
  renewalReminderStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  // ── Nominee ─────────────────────────────────────────────────────────────────

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  nomineeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 50)
  nomineeRelationship?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[+\d\s\-()\s]{0,20}$/, { message: 'Invalid nominee mobile number' })
  nomineeMobileNumber?: string;

  // ── Documents ───────────────────────────────────────────────────────────────

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  policyDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idProof?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicalDocument?: string;

  // ── Family Members ───────────────────────────────────────────────────────────

  @ApiPropertyOptional({ type: [FamilyMemberDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberDto)
  familyMembers?: FamilyMemberDto[];
}
