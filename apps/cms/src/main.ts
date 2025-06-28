import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CmsModule } from './cms.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(CmsModule);

  const configService = app.get(AppConfigService);
  try {
    configService.validateRequiredEnvVars();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Environment validation failed: ${errorMessage}`);
    process.exit(1);
  }

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('thmanyah CMS API')
    .setDescription(`
# thmanyah Content Management System API

API for managing programs and episodes for the thmanyah platform.

## Features
- **Program Management**: Create, update, and manage TV programs, podcasts, and documentaries
- **Episode Management**: Handle individual episodes with metadata, media files, and search capabilities  
- **Arabic Content Support**: Full support for Arabic titles, descriptions, and metadata
- **Media Upload**: AWS S3 integration for scalable media storage
- **Authentication**: JWT-based authentication for content editors
- **Real-time Sync**: Kafka integration for real-time content synchronization

## For Frontend Developers
- All endpoints return consistent JSON responses
- Comprehensive error handling with clear error messages
- Pagination support for list endpoints
- Search and filtering capabilities
- File upload with progress tracking
- Arabic/English bilingual content support

Visit the Discovery API at [http://localhost:3001/api/docs](http://localhost:3001/api/docs) for public content discovery endpoints.
    `)
    .setVersion('1.0')
    .addTag('cms', 'CMS System health and info')
    .addTag('auth', 'Authentication endpoints for content editors')
    .addTag('programs', 'TV programs, podcasts, and documentaries management')
    .addTag('episodes', 'Individual episodes management with metadata')
    .addTag('publishers', 'Content publishers and creators management')
    .addTag('upload', 'Media file upload to AWS S3')
    .addTag('media', 'Media files management with metadata processing')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.port;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
