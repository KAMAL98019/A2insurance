import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Erode Branch' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'ERD' })
  @IsString()
  @Length(2, 30)
  code: string;

  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 100) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 100) state?: string;
}
