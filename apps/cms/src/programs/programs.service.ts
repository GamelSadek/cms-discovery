import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program, ProgramStatus } from './programs.entity';
import { CmsKafkaProducerService } from '../kafka/cms-kafka-producer.service';

interface ProgramQueryOptions {
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
  language?: string;
}

export interface CategoryResult {
  category: string;
  count: number;
}

export interface LanguageResult {
  language: string;
  count: number;
}

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    private readonly kafkaProducer: CmsKafkaProducerService,
  ) {}

  async create(data: Partial<Program>) {
    if (!data.title || !data.description || !data.category || !data.language) {
      throw new BadRequestException(
        'Title, description, category, and language are required',
      );
    }

    const program = this.programRepo.create(data);
    const savedProgram = await this.programRepo.save(program);

    try {
      await this.kafkaProducer.publishProgramEvent('created', savedProgram);
    } catch (error) {
      console.error('Failed to publish program created event:', error);
    }

    return savedProgram;
  }

  async findAll(options: ProgramQueryOptions = {}) {
    const { limit = 10, offset = 0, search, category, language } = options;

    const queryBuilder = this.programRepo
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.episodes', 'episodes')
      .take(limit)
      .skip(offset)
      .orderBy('program.createdAt', 'DESC');

    if (search) {
      queryBuilder.where(
        'program.title ILIKE :search OR program.description ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    if (category) {
      queryBuilder.andWhere('program.category = :category', { category });
    }

    if (language) {
      queryBuilder.andWhere('program.language = :language', { language });
    }

    const [programs, total] = await queryBuilder.getManyAndCount();

    return {
      programs,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string) {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['episodes'],
    });

    if (!program) {
      throw new NotFoundException(`Program with id ${id} not found`);
    }

    return program;
  }

  async getProgramWithEpisodes(id: string) {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['episodes'],
    });

    if (!program) {
      throw new NotFoundException(`Program with id ${id} not found`);
    }

    return {
      ...program,
      episodeCount: program.episodes.length,
    };
  }

  async getCategories(): Promise<CategoryResult[]> {
    const result = await this.programRepo
      .createQueryBuilder('program')
      .select('DISTINCT program.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('program.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return result.map((item: Record<string, unknown>) => ({
      category: typeof item.category === 'string' ? item.category : '',
      count:
        typeof item.count === 'string'
          ? parseInt(item.count, 10)
          : Number(item.count) || 0,
    }));
  }

  async getLanguages(): Promise<LanguageResult[]> {
    const result = await this.programRepo
      .createQueryBuilder('program')
      .select('DISTINCT program.language', 'language')
      .addSelect('COUNT(*)', 'count')
      .groupBy('program.language')
      .orderBy('count', 'DESC')
      .getRawMany();

    return result.map((item: Record<string, unknown>) => ({
      language: typeof item.language === 'string' ? item.language : '',
      count:
        typeof item.count === 'string'
          ? parseInt(item.count, 10)
          : Number(item.count) || 0,
    }));
  }

  async update(id: string, data: Partial<Program>) {
    const program = await this.findOne(id);
    if (!program) {
      throw new NotFoundException(`Program with id ${id} not found`);
    }

    await this.programRepo.update(id, data);

    const updatedProgram = await this.programRepo.findOne({
      where: { id },
      relations: ['episodes'],
    });

    try {
      await this.kafkaProducer.publishProgramEvent('updated', updatedProgram);
    } catch (error) {
      console.error('Failed to publish program updated event:', error);
    }

    return updatedProgram;
  }

  async remove(id: string) {
    const program = await this.findOne(id);

    await this.programRepo.delete(id);

    try {
      await this.kafkaProducer.publishProgramEvent('deleted', {
        ...program,
        deleted: true,
      });
    } catch (error) {
      console.error('Failed to publish program deleted event:', error);
    }

    return {
      message: `Program "${program.title}" has been deleted successfully`,
    };
  }

  async publish(id: string) {
    const program = await this.findOne(id);
    if (!program) {
      throw new NotFoundException(`Program with id ${id} not found`);
    }

    await this.programRepo.update(id, {
      publishDate: new Date(),
      status: ProgramStatus.PUBLISHED,
    });

    const publishedProgram = await this.programRepo.findOne({
      where: { id },
      relations: ['episodes'],
    });

    try {
      await this.kafkaProducer.publishProgramEvent(
        'published',
        publishedProgram,
      );
    } catch (error) {
      console.error('Failed to publish program published event:', error);
    }

    return publishedProgram;
  }

  async unpublish(id: string) {
    const program = await this.findOne(id);
    if (!program) {
      throw new NotFoundException(`Program with id ${id} not found`);
    }

    await this.programRepo.update(id, {
      publishDate: undefined,
      status: ProgramStatus.DRAFT,
    });

    const unpublishedProgram = await this.programRepo.findOne({
      where: { id },
      relations: ['episodes'],
    });

    try {
      await this.kafkaProducer.publishProgramEvent(
        'unpublished',
        unpublishedProgram,
      );
    } catch (error) {
      console.error('Failed to publish program unpublished event:', error);
    }

    return unpublishedProgram;
  }
}
