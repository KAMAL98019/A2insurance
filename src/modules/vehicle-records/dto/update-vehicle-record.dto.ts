import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateVehicleRecordDto {
  @ApiPropertyOptional({ example: 'MH12AB1234' })
  @IsOptional() @IsString() @Length(1, 50)
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: 'Rajesh Kumar' })
  @IsOptional() @IsString() @Length(2, 100)
  ownerName?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @Matches(/^[+\d\s\-()\s]{7,20}$/, { message: 'Invalid cell number' })
  cellNumber?: string;

  @ApiPropertyOptional({ example: '+91 98765 43211' })
  @IsOptional()
  @IsString()
  @Matches(/^[+\d\s\-()\s]{7,20}$/, { message: 'Invalid secondary number' })
  cellNumberAlt?: string;

  @ApiPropertyOptional({ example: 'CAR' })
  @IsOptional() @IsString() @Length(1, 50)
  category?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional() @IsDateString()
  policyExpiryDate?: string;

  @ApiPropertyOptional({ example: 'HDFC Ergo' })
  @IsOptional() @IsString() @Length(2, 150)
  insuranceCompany?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  rcDocument?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  insuranceDocument?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  aadhaarDocument?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  panDocument?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  photo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  odDocument?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tpDocument?: string;
}
