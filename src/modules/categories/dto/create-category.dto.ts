import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'TRUCK' })
  @IsString()
  @Length(1, 50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'Name must be uppercase letters, digits, or underscores' })
  name: string;
}
