import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('Barbearia do Artur API')
    .setDescription('API da Barbearia do Artur para agenda, clientes, serviços, lojinha, pacotes e rotina operacional do Artur.')
    .setVersion('1.0')
    .addTag('auth', 'Autenticação e autorização')
    .addTag('professionals', 'Gestão de profissionais')
    .addTag('clients', 'Gestão de clientes')
    .addTag('services', 'Gestão de serviços')
    .addTag('appointments', 'Gestão de agendamentos')
    .addTag('health', 'Verificação de saúde')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
};
