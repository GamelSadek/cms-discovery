import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program, ProgramStatus } from '../shared/entities/program.entity';
import { Episode, EpisodeStatus } from '../shared/entities/episode.entity';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: string,
    language?: string,
    type?: string,
  ): Promise<{
    programs: Program[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.episodes', 'episode')
      .where('program.status = :status', { status: ProgramStatus.PUBLISHED });

    if (category) {
      queryBuilder.andWhere('program.category = :category', { category });
    }

    if (language) {
      queryBuilder.andWhere('program.language = :language', { language });
    }

    if (type) {
      queryBuilder.andWhere('program.type = :type', { type });
    }

    const [programs, total] = await queryBuilder
      .orderBy('program.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      programs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id, status: ProgramStatus.PUBLISHED },
      relations: ['episodes', 'publisher'],
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    // Increment view count
    await this.programRepository.update(id, {
      viewCount: program.viewCount + 1,
    });

    return program;
  }

  async getEpisodes(
    programId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    episodes: Episode[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [episodes, total] = await this.episodeRepository.findAndCount({
      where: {
        program: { id: programId },
        status: EpisodeStatus.PUBLISHED,
      },
      relations: ['program'],
      order: { episodeNumber: 'ASC' },
      skip,
      take: limit,
    });

    return {
      episodes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeaturedPrograms(limit: number = 5): Promise<Program[]> {
    return this.programRepository.find({
      where: { status: ProgramStatus.PUBLISHED },
      relations: ['episodes'],
      order: { rating: 'DESC' },
      take: limit,
    });
  }

  async getPopularPrograms(limit: number = 5): Promise<Program[]> {
    return this.programRepository.find({
      where: { status: ProgramStatus.PUBLISHED },
      relations: ['episodes'],
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }
}
