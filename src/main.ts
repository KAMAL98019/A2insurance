import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ModulePermissionGuard } from './common/guards/module-permission.guard';
import { AccessControlService } from './common/access-control/access-control.service';
import { PrismaService } from './prisma/prisma.service';
import { createSwaggerAuthMiddleware } from './common/middleware/swagger-auth.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'https://a2insurancecare.in',
      'https://www.a2insurancecare.in',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  const reflector = app.get(Reflector);
  const accessControlService = app.get(AccessControlService);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
    new ModulePermissionGuard(reflector, accessControlService),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Swagger ──────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('A2 Insurance API')
    .setDescription('Vehicle Insurance Management System — REST API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management (admin only)')
    .build();

  // Gate Swagger UI + its raw spec behind Master Admin credentials
  const prismaService = app.get(PrismaService);
  const swaggerAuth = createSwaggerAuthMiddleware(prismaService);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/docs')) return swaggerAuth(req, res, next);
    next();
  });

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1,
    },
    customSiteTitle: 'A2 Insurance API Docs',
  });

  // Health check — used by Render
  app.getHttpAdapter().get('/health', (_req, res) => res.send('ok'));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`A2 Insurance API  →  http://localhost:${port}/api`);
  console.log(`Swagger Docs      →  http://localhost:${port}/api/docs`);
}
bootstrap();
