import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class UpdateSalonSettingsDto {
  @IsOptional()
  @IsString()
  salonName?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  appointmentLeadTimeMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationWindowHours?: number;

  @IsOptional()
  @IsObject()
  reminderLeadHours?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  allowWaitlist?: boolean;

  @IsOptional()
  @IsBoolean()
  enableCheckout?: boolean;

  @IsOptional()
  @IsBoolean()
  enableLoyalty?: boolean;

  @IsOptional()
  @IsBoolean()
  enableCashback?: boolean;

  @IsOptional()
  @IsBoolean()
  enableReferrals?: boolean;

  @IsOptional()
  @IsBoolean()
  enableProductCatalog?: boolean;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;

  @IsOptional()
  @IsUrl()
  privacyPolicyUrl?: string;
}
