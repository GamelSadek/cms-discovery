import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DiscoveryModule } from './discovery.module';
import { HttpExceptionFilter } from './shared/filters/exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { AppConfigService } from './shared/config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(DiscoveryModule);
  const configService = app.get(AppConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: configService.appConfig.allowedOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('thmanyah Discovery API')
    .setDescription(
      `
# thmanyah Content Discovery API

Public API for discovering and searching thmanyah content including podcasts, documentaries, and TV programs.

## Features
- **Content Search**: Advanced search with Arabic and English support
- **Program Discovery**: Browse TV programs, podcasts, and documentaries
- **Episode Browsing**: Find and filter individual episodes
- **Multi-language Support**: Arabic and English content discovery
- **High Performance**: Redis caching for fast response times
- **Real-time Updates**: Kafka-powered real-time content synchronization

## For Frontend Developers
- No authentication required for public endpoints
- Consistent JSON responses with pagination
- Advanced filtering and search capabilities
- Arabic/English bilingual content support
- Optimized for mobile and web applications
- High-performance caching for better user experience

## Content Types
- **Podcasts**: Audio content with episode support
- **Documentaries**: Video documentaries with metadata
- **TV Series**: Multi-episode television content
- **Movies**: Feature-length video content

Visit the CMS API at [http://localhost:3000/api/docs](http://localhost:3000/api/docs) for content management endpoints.
    `,
    )
    .setVersion('1.0')
    .addTag('discovery', 'Content discovery and system health')
    .addTag('search', 'Advanced search with filtering capabilities')
    .addTag('programs', 'Browse and discover programs')
    .addTag('episodes', 'Find and filter episodes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.DISCOVERY_PORT || 3001;
  await app.listen(port);
  console.log(`Discovery API is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api-docs`);
}

void bootstrap();
