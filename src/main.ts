import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  // HTTP Compression
  app.use(compression());

  // Input Validation & Transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS Configuration for Mobile App & Web Frontends
  const clientUrls = (process.env.CLIENT_URL || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, native agents)
      if (!origin) return callback(null, true);
      if (clientUrls.includes('*') || clientUrls.includes(origin)) {
        return callback(null, true);
      }
      // Allow localhost in development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback to allow direct mobile consumption
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-App-Platform',
      'X-App-Version',
    ],
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('MANAM REST API')
    .setDescription('Production REST API for MANAM Mobile App and E-commerce Platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Users')
    .addTag('Products')
    .addTag('Categories')
    .addTag('Cart')
    .addTag('Orders')
    .addTag('Payments')
    .addTag('Coupons')
    .addTag('Content')
    .addTag('Notifications')
    .addTag('Admin')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);

  logger.log(`🚀 MANAM Backend running on port ${port}`);
  logger.log(`📖 Swagger API documentation available at http://localhost:${port}/api/docs`);
  logger.log(`🌐 Production target: https://api.manammcare.com`);
}

bootstrap();
