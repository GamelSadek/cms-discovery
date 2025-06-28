import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CmsKafkaProducerService } from './cms-kafka-producer.service';
import { KafkaEventEntity } from './kafka-event.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([KafkaEventEntity])],
  providers: [CmsKafkaProducerService],
  exports: [CmsKafkaProducerService],
})
export class CmsKafkaModule {}
