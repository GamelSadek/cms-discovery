import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { ProgramsModule } from './programs/programs.module';
import { Program } from './programs/programs.entity';
import { Episode } from './episodes/episode.entity';
import { Publisher } from './publishers/publishers.entity';
import { MediaFile } from './media/media-file.entity';
import { EpisodesModule } from './episodes/episodes.module';
import { PublishersModule } from './publishers/publishers.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { MediaModule } from './media/media.module';
import { CmsKafkaModule } from './kafka/cms-kafka.module';
import { KafkaEventEntity } from './kafka/kafka-event.entity';
import { AppConfigService } from './config/app-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.getOrThrow<string>('DB_USERNAME'),
          password: configService.getOrThrow<string>('DB_PASSWORD'),
          database: configService.getOrThrow<string>('DB_NAME'),
          entities: [Program, Episode, Publisher, MediaFile, KafkaEventEntity],
          synchronize: configService.get('NODE_ENV') !== 'production',
        };
        return config;
      },
      inject: [ConfigService],
    }),
    ProgramsModule,
    EpisodesModule,
    PublishersModule,
    AuthModule,
    UploadModule,
    MediaModule,
    CmsKafkaModule,
  ],
  controllers: [CmsController],
  providers: [CmsService, AppConfigService],
})
export class CmsModule {}
