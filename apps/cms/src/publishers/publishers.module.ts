import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publisher } from './publishers.entity';
import { PublishersService } from './publishers.service';
import { PublishersController } from './publishers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Publisher])],
  providers: [PublishersService],
  controllers: [PublishersController],
  exports: [PublishersService],
})
export class PublishersModule {}
