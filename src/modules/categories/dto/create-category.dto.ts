import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, Matches, IsOptional, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'CAR' })
  @IsString()
  @Length(1, 50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'Name must be uppercase letters, digits, or underscores' })
  name: string;

  @ApiPropertyOptional({ example: 1, description: 'Parent category ID (omit for top-level)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  parentId?: number;
}
