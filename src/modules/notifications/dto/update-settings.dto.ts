import { IsOptional, IsInt, IsBoolean, IsString, Min, Max } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsInt() @Min(1) @Max(365)
  firstAlertDays?: number;

  @IsOptional() @IsInt() @Min(1) @Max(365)
  secondAlertDays?: number;

  @IsOptional() @IsInt() @Min(1) @Max(365)
  finalAlertDays?: number;

  @IsOptional() @IsInt() @Min(0) @Max(23)
  schedulerHour?: number;

  @IsOptional() @IsBoolean()
  enableWhatsApp?: boolean;

  @IsOptional() @IsBoolean()
  enableEmail?: boolean;

  @IsOptional() @IsBoolean()
  enableSms?: boolean;

  @IsOptional() @IsString()
  language?: string;

  @IsOptional() @IsString()
  contactName?: string;

  @IsOptional() @IsString()
  contactPhone?: string;

  @IsOptional() @IsString()
  contactAddress?: string;

  @IsOptional() @IsString()
  whatsappApiKey?: string;

  @IsOptional() @IsString()
  whatsappApiUrl?: string;

  @IsOptional() @IsString()
  whatsappMessageId?: string;

  @IsOptional() @IsString()
  whatsappPhoneNumberId?: string;
}
