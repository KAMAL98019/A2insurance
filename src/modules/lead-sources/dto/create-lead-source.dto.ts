import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateLeadSourceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
