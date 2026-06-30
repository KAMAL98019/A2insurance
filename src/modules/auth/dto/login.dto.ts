import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@a2insurance.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin1234' })
  @IsString()
  @Length(8, 100)
  password: string;
}
