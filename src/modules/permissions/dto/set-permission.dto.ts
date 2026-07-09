import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, Length } from 'class-validator';

export class SetPermissionDto {
  @ApiProperty({ example: 'vehicle-records' })
  @IsString()
  @Length(1, 50)
  moduleName: string;

  @ApiProperty() @IsBoolean() canView: boolean;
  @ApiProperty() @IsBoolean() canCreate: boolean;
  @ApiProperty() @IsBoolean() canUpdate: boolean;
  @ApiProperty() @IsBoolean() canDelete: boolean;
  @ApiProperty() @IsBoolean() canExport: boolean;
}
