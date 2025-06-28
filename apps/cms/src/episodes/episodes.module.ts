import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpisodesService } from './episodes.service';
import { EpisodesController } from './episodes.controller';
import { Episode } from './episode.entity';
import { Program } from '../programs/programs.entity';
import { CmsKafkaModule } from '../kafka/cms-kafka.module';

@Module({
  imports: [TypeOrmModule.forFeature([Episode, Program]), CmsKafkaModule],
  providers: [EpisodesService],
  controllers: [EpisodesController],
})
export class EpisodesModule {}
