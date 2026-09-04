import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), { prefix: '/uploads' });

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();