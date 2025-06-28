import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Episode, EpisodeStatus } from './episode.entity';
import { Repository } from 'typeorm';
import { Program } from '../programs/programs.entity';
import { CmsKafkaProducerService } from '../kafka/cms-kafka-producer.service';

interface EpisodeQueryOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

@Injectable()
export class EpisodesService {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    private readonly kafkaProducer: CmsKafkaProducerService,
  ) {}

  async create(programId: string, data: Partial<Episode>) {
    if (!data.title || !data.duration) {
      throw new BadRequestException('Title and duration are required');
    }

    const program = await this.programRepo.findOneBy({ id: programId });
    if (!program) {
      throw new NotFoundException(`Program with id ${programId} not found`);
    }

    const episode = this.episodeRepo.create({ ...data, program });
    const savedEpisode = await this.episodeRepo.save(episode);

    try {
      await this.kafkaProducer.publishEpisodeEvent('created', savedEpisode);
    } catch (error) {
      console.error('Failed to publish episode created event:', error);
    }

    return savedEpisode;
  }

  async findAll(options: EpisodeQueryOptions = {}) {
    const { limit = 10, offset = 0, search } = options;

    const queryBuilder = this.episodeRepo
      .createQueryBuilder('episode')
      .leftJoinAndSelect('episode.program', 'program')
      .take(limit)
      .skip(offset)
      .orderBy('episode.createdAt', 'DESC');

    if (search) {
      queryBuilder.where(
        'episode.title ILIKE :search OR episode.description ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    const [episodes, total] = await queryBuilder.getManyAndCount();

    return {
      episodes,
      total,
      limit,
      offset,
    };
  }

  async findByProgram(programId: string, options: EpisodeQueryOptions = {}) {
    const { limit = 10, offset = 0, search } = options;

    const program = await this.programRepo.findOneBy({ id: programId });
    if (!program) {
      throw new NotFoundException(`Program with id ${programId} not found`);
    }

    const queryBuilder = this.episodeRepo
      .createQueryBuilder('episode')
      .leftJoinAndSelect('episode.program', 'program')
      .where('episode.program.id = :programId', { programId })
      .take(limit)
      .skip(offset)
      .orderBy('episode.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        'episode.title ILIKE :search OR episode.description ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    const [episodes, total] = await queryBuilder.getManyAndCount();

    return {
      episodes,
      total,
      limit,
      offset,
      program,
    };
  }

  async findOne(id: string) {
    const episode = await this.episodeRepo.findOne({
      where: { id },
      relations: ['program'],
    });

    if (!episode) {
      throw new NotFoundException(`Episode with id ${id} not found`);
    }

    return episode;
  }

  async update(id: string, data: Partial<Episode>) {
    const episode = await this.findOne(id);
    if (!episode) {
      throw new NotFoundException(`Episode with id ${id} not found`);
    }

    await this.episodeRepo.update(id, data);

    const updatedEpisode = await this.episodeRepo.findOne({
      where: { id },
      relations: ['program'],
    });

    try {
      await this.kafkaProducer.publishEpisodeEvent('updated', updatedEpisode);
    } catch (error) {
      console.error('Failed to publish episode updated event:', error);
    }

    return updatedEpisode;
  }

  async remove(id: string) {
    const episode = await this.findOne(id);

    await this.episodeRepo.delete(id);

    try {
      await this.kafkaProducer.publishEpisodeEvent('deleted', {
        ...episode,
        deleted: true,
      });
    } catch (error) {
      console.error('Failed to publish episode deleted event:', error);
    }

    return {
      message: `Episode "${episode.title}" has been deleted successfully`,
    };
  }

  async publish(id: string) {
    const episode = await this.findOne(id);
    if (!episode) {
      throw new NotFoundException(`Episode with id ${id} not found`);
    }

    await this.episodeRepo.update(id, {
      publishDate: new Date(),
      status: EpisodeStatus.PUBLISHED,
    });

    const publishedEpisode = await this.episodeRepo.findOne({
      where: { id },
      relations: ['program'],
    });

    try {
      await this.kafkaProducer.publishEpisodeEvent(
        'published',
        publishedEpisode,
      );
    } catch (error) {
      console.error('Failed to publish episode published event:', error);
    }

    return publishedEpisode;
  }

  async unpublish(id: string) {
    const episode = await this.findOne(id);
    if (!episode) {
      throw new NotFoundException(`Episode with id ${id} not found`);
    }

    await this.episodeRepo.update(id, {
      publishDate: undefined,
      status: EpisodeStatus.DRAFT,
    });

    const unpublishedEpisode = await this.episodeRepo.findOne({
      where: { id },
      relations: ['program'],
    });

    try {
      await this.kafkaProducer.publishEpisodeEvent(
        'unpublished',
        unpublishedEpisode,
      );
    } catch (error) {
      console.error('Failed to publish episode unpublished event:', error);
    }

    return unpublishedEpisode;
  }
}
