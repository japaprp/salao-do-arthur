import { plainToClass } from 'class-transformer';
import { IsNotEmpty, IsString, IsEnum, IsOptional, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL!: string;

  @IsNotEmpty()
  @IsString()
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN: string = '1h';

  @IsOptional()
  @IsString()
  REFRESH_TOKEN_SECRET?: string;

  @IsOptional()
  @IsString()
  REFRESH_TOKEN_EXPIRES_IN: string = '7d';

  @IsOptional()
  @IsString()
  PASSWORD_RESET_SECRET?: string;

  @IsOptional()
  @IsString()
  WEB_APP_URL?: string;

  @IsOptional()
  @IsString()
  PORT: string = '3100';

  @IsOptional()
  @IsString()
  BACKEND_PORT: string = '3100';

  @IsOptional()
  @IsString()
  LOG_LEVEL: string = 'info';

  @IsOptional()
  @IsString()
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;

  @IsOptional()
  @IsString()
  GOOGLE_APPLICATION_CREDENTIALS?: string;

  @IsOptional()
  @IsString()
  MERCADO_PAGO_ACCESS_TOKEN?: string;

  @IsOptional()
  @IsString()
  MERCADO_PAGO_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  MERCADO_PAGO_WEBHOOK_URL?: string;

  @IsOptional()
  @IsString()
  MERCADO_PAGO_SANDBOX?: string;

  @IsOptional()
  @IsString()
  MOBILE_PAYMENT_RETURN_URL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  if (validatedConfig.NODE_ENV === Environment.Production) {
    const requiredSecrets = [
      ['JWT_SECRET', validatedConfig.JWT_SECRET],
      ['REFRESH_TOKEN_SECRET', validatedConfig.REFRESH_TOKEN_SECRET],
      ['PASSWORD_RESET_SECRET', validatedConfig.PASSWORD_RESET_SECRET],
    ] as const;
    for (const [name, value] of requiredSecrets) {
      if (typeof value !== 'string' || value.length < 32 || /change_this|troque_essa|example|placeholder/i.test(value)) {
        throw new Error('Production requires ' + name + ' to be a unique secret with at least 32 characters.');
      }
    }
    const secretValues = requiredSecrets.map(([, value]) => value);
    if (new Set(secretValues).size !== secretValues.length) {
      throw new Error('JWT_SECRET, REFRESH_TOKEN_SECRET and PASSWORD_RESET_SECRET must be different.');
    }
    if (!String(config.CORS_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean).length) {
      throw new Error('Production requires at least one explicit CORS_ORIGINS entry.');
    }
  }
  return validatedConfig;
}
