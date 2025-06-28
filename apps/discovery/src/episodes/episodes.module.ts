import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';
import { Episode } from '../shared/entities/episode.entity';
import { Program } from '../shared/entities/program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Episode, Program])],
  controllers: [EpisodesController],
  providers: [EpisodesService],
  exports: [EpisodesService],
})
export class EpisodesModule {}
