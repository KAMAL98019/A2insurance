import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';

export class CreateVehicleRecordDto {
  @ApiPropertyOptional({ example: 1, description: 'Defaults to the caller\'s primary location if omitted' })
  @IsOptional()
  @IsInt()
  locationId?: number;

  @ApiProperty({ example: 'MH12AB1234' })
  @IsString()
  @Length(1, 50)
  vehicleNumber: string;

  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  @Length(2, 100)
  ownerName: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @Matches(/^[+\d\s\-()\s]{7,20}$/, { message: 'Invalid cell number' })
  cellNumber: string;

  @ApiPropertyOptional({ example: '+91 98765 43211' })
  @ValidateIf((o) => !!o.cellNumberAlt)
  @IsString()
  @Matches(/^[+\d\s\-()\s]{7,20}$/, { message: 'Invalid secondary number' })
  cellNumberAlt?: string;

  @ApiProperty({ example: 'CAR' })
  @IsString()
  @Length(1, 50)
  category: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  policyExpiryDate: string;

  @ApiProperty({ example: 'HDFC Ergo' })
  @IsString()
  @Length(2, 150)
  insuranceCompany: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  @IsOptional()
  @IsString()
  rcDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insuranceDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aadhaarDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  panDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  odDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tpDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
