import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { buildCorsOptions, securityHeadersMiddleware } from './common/config/http-security.config';

loadEnv({
  path: path.resolve(process.cwd(), '.env'),
});

async function bootstrap() {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`❌ Variável de ambiente obrigatória não definida: ${envVar}`);
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 3100);
  const host = process.env.HOST ?? '127.0.0.1';

  app.disable('x-powered-by');
  app.use(cookieParser());
  app.enableCors(buildCorsOptions());
  app.use(securityHeadersMiddleware(isProduction));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix('api');

  const enableSwagger = process.env.ENABLE_SWAGGER === 'true';
  if (enableSwagger) {
    setupSwagger(app);
  }

  console.log(`⏳ Iniciando listen em ${host}:${port}`);
  await app.listen(port, host);
  console.log(`✅ Listen concluido em ${host}:${port}`);

  const appUrl = await app.getUrl();
  console.log(`✅ Servidor iniciado em ${appUrl}`);
  if (enableSwagger) {
    console.log(`📚 Documentação Swagger disponível em ${appUrl}/api/docs`);
  }
  console.log(`🔐 Autenticação com Refresh Token ativada`);
  console.log(`📊 Logging estruturado com Winston`);
}

void bootstrap().catch((error) => {
  console.error('❌ Erro ao iniciar aplicação:', error);
  process.exit(1);
});
