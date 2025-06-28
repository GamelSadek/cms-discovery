import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryKafkaConsumerService } from './discovery-kafka-consumer.service';
import { DiscoveryProgram } from '../entities/discovery-program.entity';
import { DiscoveryEpisode } from '../entities/discovery-episode.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([DiscoveryProgram, DiscoveryEpisode]),
  ],
  providers: [DiscoveryKafkaConsumerService],
  exports: [DiscoveryKafkaConsumerService],
})
export class DiscoveryKafkaModule {}
