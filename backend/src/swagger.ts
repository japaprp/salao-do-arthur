import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: any) => {
  const config = new DocumentBuilder()
    .setTitle('Salão da Lu API')
    .setDescription('API completa para gestão de salão de beleza')
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
