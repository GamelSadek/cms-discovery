import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode, EpisodeStatus } from '../shared/entities/episode.entity';
import { Program } from '../shared/entities/program.entity';

@Injectable()
export class EpisodesService {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>,
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: string,
    language?: string,
  ): Promise<{
    episodes: Episode[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.episodeRepository
      .createQueryBuilder('episode')
      .leftJoinAndSelect('episode.program', 'program')
      .where('episode.status = :status', { status: EpisodeStatus.PUBLISHED });

    if (category) {
      queryBuilder.andWhere('program.category = :category', { category });
    }

    if (language) {
      queryBuilder.andWhere('program.language = :language', { language });
    }

    const [episodes, total] = await queryBuilder
      .orderBy('episode.publishDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      episodes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Episode> {
    const episode = await this.episodeRepository.findOne({
      where: { id, status: EpisodeStatus.PUBLISHED },
      relations: ['program'],
    });

    if (!episode) {
      throw new NotFoundException(`Episode with ID ${id} not found`);
    }

    // Increment view count
    await this.episodeRepository.update(id, {
      viewCount: episode.viewCount + 1,
    });

    return episode;
  }

  async findByProgram(
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

  async getLatestEpisodes(limit: number = 5): Promise<Episode[]> {
    return this.episodeRepository.find({
      where: { status: EpisodeStatus.PUBLISHED },
      relations: ['program'],
      order: { publishDate: 'DESC' },
      take: limit,
    });
  }

  async getPopularEpisodes(limit: number = 5): Promise<Episode[]> {
    return this.episodeRepository.find({
      where: { status: EpisodeStatus.PUBLISHED },
      relations: ['program'],
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }
}
