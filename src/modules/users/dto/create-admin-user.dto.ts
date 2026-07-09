import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, IsInt, IsOptional } from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'Admin User A' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'adminA@a2insurance.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9000000003' })
  @IsString()
  @Length(7, 20)
  phoneNumber: string;

  @ApiProperty({ example: 'Password1', minLength: 8 })
  @IsString()
  @Length(8, 100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({ example: 1, description: 'The single location this Admin User is assigned to' })
  @IsInt()
  locationId: number;

  @ApiPropertyOptional({ example: 3, description: 'Master Admin only — which Super Admin owns this Admin User' })
  @IsOptional()
  @IsInt()
  superAdminId?: number;
}
