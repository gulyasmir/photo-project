import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Distributed Photo Processing ')
    .setDescription('Сервис распределенной обработки фотографий на NestJS')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const options: SwaggerCustomOptions = {
    swaggerOptions: {
      filter: true,
      displayOperationId: true,
      docExpansion: 'none',
      deepScanRoutes: true,
      tagsSorter: 'alpha',
    },
  };
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(3000);
}
bootstrap();
