import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'TRUCK' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'Name must be uppercase letters, digits, or underscores' })
  name?: string;
}
