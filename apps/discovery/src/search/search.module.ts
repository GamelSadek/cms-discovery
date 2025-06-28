import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { DiscoveryProgram } from '../entities/discovery-program.entity';
import { DiscoveryEpisode } from '../entities/discovery-episode.entity';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiscoveryProgram, DiscoveryEpisode]),
    CacheModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
