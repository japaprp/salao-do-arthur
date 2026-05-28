import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  tenantSubdomain!: string;

  @IsEmail()
  email!: string;
}
