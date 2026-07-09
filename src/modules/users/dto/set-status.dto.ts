import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SetStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] })
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'])
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}
