import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Allow larger JSON bodies so a base64-encoded logo (stored in settings) fits.
  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { limit: '5mb', extended: true });

  app.use(helmet());

  // FRONTEND_URL may be a comma-separated list (e.g. prod + custom domain).
  const allowedOrigins = config
    .get<string>('FRONTEND_URL', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // allow non-browser tools (no origin) and any explicitly allowed origin;
      // deny others silently (the browser blocks them) without throwing a 500.
      callback(null, !origin || allowedOrigins.includes(origin));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.setGlobalPrefix('api/v1');

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api/v1`);
}

bootstrap();
