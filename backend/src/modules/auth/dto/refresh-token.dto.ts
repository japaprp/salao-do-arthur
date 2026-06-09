import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class RefreshTokenResponseDto {
  accessToken!: string;
  refreshToken!: string;
  tokenType = 'Bearer' as const;
  expiresIn!: string | number;
}
