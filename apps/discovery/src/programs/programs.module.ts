import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { Program } from '../shared/entities/program.entity';
import { Episode } from '../shared/entities/episode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Program, Episode])],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
