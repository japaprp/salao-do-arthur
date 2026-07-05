import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsOptional()
  @IsString()
  tenantSubdomain?: string;

  @IsEmail()
  email!: string;
}
