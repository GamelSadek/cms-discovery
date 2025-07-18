import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { Program } from './programs.entity';
import { CmsKafkaModule } from '../kafka/cms-kafka.module';

@Module({
  imports: [TypeOrmModule.forFeature([Program]), CmsKafkaModule],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
