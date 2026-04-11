import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { buildCorsOptions, securityHeadersMiddleware } from './common/config/http-security.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });
  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 3000);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.enableCors(buildCorsOptions());
  app.use(securityHeadersMiddleware(isProduction));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api');

  setupSwagger(app);

  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api/docs`);
}

bootstrap();
