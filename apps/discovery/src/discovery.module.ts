import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { SearchModule } from './search/search.module';
import { EpisodesModule } from './episodes/episodes.module';
import { ProgramsModule } from './programs/programs.module';
import { CacheModule } from './cache/cache.module';
import { DiscoveryKafkaModule } from './kafka/discovery-kafka.module';
import { AppConfigService } from './shared/config/app-config.service';
import { Program } from './shared/entities/program.entity';
import { Episode } from './shared/entities/episode.entity';
import { Publisher } from './shared/entities/publisher.entity';
import { DiscoveryProgram } from './entities/discovery-program.entity';
import { DiscoveryEpisode } from './entities/discovery-episode.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DISCOVERY_DB_HOST', 'localhost'),
        port: configService.get('DISCOVERY_DB_PORT', 5433),
        username: configService.get('DISCOVERY_DB_USERNAME', 'discovery_user'),
        password: configService.get(
          'DISCOVERY_DB_PASSWORD',
          'discovery_password',
        ),
        database: configService.get('DISCOVERY_DB_NAME', 'discovery_db'),
        entities: [
          Program,
          Episode,
          Publisher,
          DiscoveryProgram,
          DiscoveryEpisode,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    CacheModule,
    SearchModule,
    EpisodesModule,
    ProgramsModule,
    DiscoveryKafkaModule,
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, AppConfigService],
})
export class DiscoveryModule {}
