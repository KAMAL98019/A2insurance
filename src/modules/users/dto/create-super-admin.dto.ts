import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateSuperAdminDto {
  @ApiProperty({ example: 'Erode Super Admin' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'super@a2insurance.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9000000002' })
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
}
