import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DiscoveryProgram } from '../entities/discovery-program.entity';
import { DiscoveryEpisode } from '../entities/discovery-episode.entity';
import { SearchQueryDto } from './dto/search-query.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(DiscoveryProgram)
    private readonly programRepository: Repository<DiscoveryProgram>,
    @InjectRepository(DiscoveryEpisode)
    private readonly episodeRepository: Repository<DiscoveryEpisode>,
    private readonly cacheService: CacheService,
  ) {}

  async search(searchQuery: SearchQueryDto) {
    const cacheKey = this.cacheService.generateKey('search', searchQuery);
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const results = await this.performSearch(searchQuery);
    this.cacheService.set(cacheKey, results, 300); // Cache for 5 minutes
    return results;
  }

  private async performSearch(query: SearchQueryDto) {
    const { contentType = 'all', page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    let programs: DiscoveryProgram[] = [];
    let episodes: DiscoveryEpisode[] = [];
    let totalPrograms = 0;
    let totalEpisodes = 0;

    if (contentType === 'all' || contentType === 'programs') {
      const programResult = await this.searchPrograms(query, offset, limit);
      programs = programResult.programs;
      totalPrograms = programResult.total;
    }

    if (contentType === 'all' || contentType === 'episodes') {
      const episodeResult = await this.searchEpisodes(query, offset, limit);
      episodes = episodeResult.episodes;
      totalEpisodes = episodeResult.total;
    }

    return {
      programs,
      episodes,
      pagination: {
        page,
        limit,
        totalPrograms,
        totalEpisodes,
        totalProgramPages: Math.ceil(totalPrograms / limit),
        totalEpisodePages: Math.ceil(totalEpisodes / limit),
      },
      filters: this.getAppliedFilters(query),
    };
  }

  private async searchPrograms(
    query: SearchQueryDto,
    offset: number,
    limit: number,
  ) {
    let queryBuilder = this.createProgramQueryBuilder(query);

    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    queryBuilder = this.applySortingToPrograms(queryBuilder, query);
    queryBuilder.offset(offset).limit(limit);

    const programs = await queryBuilder.getMany();

    return { programs, total };
  }

  private async searchEpisodes(
    query: SearchQueryDto,
    offset: number,
    limit: number,
  ) {
    let queryBuilder = this.createEpisodeQueryBuilder(query);

    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    queryBuilder = this.applySortingToEpisodes(queryBuilder, query);
    queryBuilder.offset(offset).limit(limit);

    const episodes = await queryBuilder.getMany();

    return { episodes, total };
  }

  private createProgramQueryBuilder(
    query: SearchQueryDto,
  ): SelectQueryBuilder<DiscoveryProgram> {
    const queryBuilder = this.programRepository
      .createQueryBuilder('program')
      .where('1 = 1'); // Base condition to allow andWhere clauses

    // Text search with Arabic support
    if (query.q) {
      const searchConditions = [
        'program.title ILIKE :search',
        'program.description ILIKE :search',
        'program.shortDescription ILIKE :search',
        'program.titleAr ILIKE :search',
        'program.descriptionAr ILIKE :search',
        'program.shortDescriptionAr ILIKE :search',
      ];

      queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, {
        search: `%${query.q}%`,
      });
    }

    // Category filter
    if (query.category) {
      queryBuilder.andWhere('program.category ILIKE :category', {
        category: `%${query.category}%`,
      });
    }

    // Language filter
    if (query.language) {
      queryBuilder.andWhere('program.language = :language', {
        language: query.language,
      });
    }

    // Type filter
    if (query.type) {
      queryBuilder.andWhere('program.type = :type', { type: query.type });
    }

    // Tags filter
    if (query.tags) {
      const tags = query.tags.split(',').map((tag) => tag.trim());
      queryBuilder.andWhere('program.tags && :tags', { tags });
    }

    // Rating filter
    if (query.minRating !== undefined) {
      queryBuilder.andWhere('program.rating >= :minRating', {
        minRating: query.minRating,
      });
    }

    return queryBuilder;
  }

  private createEpisodeQueryBuilder(
    query: SearchQueryDto,
  ): SelectQueryBuilder<DiscoveryEpisode> {
    const queryBuilder = this.episodeRepository
      .createQueryBuilder('episode')
      .where('1 = 1'); // Base condition to allow andWhere clauses

    // Text search with Arabic support
    if (query.q) {
      const searchConditions = [
        'episode.title ILIKE :search',
        'episode.description ILIKE :search',
        'episode.titleAr ILIKE :search',
        'episode.descriptionAr ILIKE :search',
      ];

      queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, {
        search: `%${query.q}%`,
      });
    }

    // Category filter (using stored program category)
    if (query.category) {
      queryBuilder.andWhere('episode.programCategory ILIKE :category', {
        category: `%${query.category}%`,
      });
    }

    // Language filter
    if (query.language) {
      queryBuilder.andWhere('episode.language = :language', {
        language: query.language,
      });
    }

    // Tags filter
    if (query.tags) {
      const tags = query.tags.split(',').map((tag) => tag.trim());
      queryBuilder.andWhere('episode.tags && :tags', { tags });
    }

    // Rating filter
    if (query.minRating !== undefined) {
      queryBuilder.andWhere('episode.rating >= :minRating', {
        minRating: query.minRating,
      });
    }

    return queryBuilder;
  }

  private applySortingToPrograms(
    queryBuilder: SelectQueryBuilder<DiscoveryProgram>,
    query: SearchQueryDto,
  ): SelectQueryBuilder<DiscoveryProgram> {
    const { sortBy = 'relevance', sortOrder = 'desc' } = query;

    switch (sortBy) {
      case 'date':
        queryBuilder.orderBy(
          'program.publishDate',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'title':
        queryBuilder.orderBy(
          'program.title',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'rating':
        queryBuilder.orderBy(
          'program.rating',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'views':
        queryBuilder.orderBy(
          'program.viewCount',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'relevance':
      default:
        queryBuilder
          .orderBy('program.viewCount', 'DESC')
          .addOrderBy('program.rating', 'DESC');
        break;
    }

    return queryBuilder;
  }

  private applySortingToEpisodes(
    queryBuilder: SelectQueryBuilder<DiscoveryEpisode>,
    query: SearchQueryDto,
  ): SelectQueryBuilder<DiscoveryEpisode> {
    const { sortBy = 'relevance', sortOrder = 'desc' } = query;

    switch (sortBy) {
      case 'date':
        queryBuilder.orderBy(
          'episode.publishDate',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'title':
        queryBuilder.orderBy(
          'episode.title',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'views':
        queryBuilder.orderBy(
          'episode.viewCount',
          sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'relevance':
      default:
        queryBuilder.orderBy('episode.viewCount', 'DESC');
        break;
    }

    return queryBuilder;
  }

  private getAppliedFilters(query: SearchQueryDto): Record<string, any> {
    const filters: Record<string, any> = {};
    if (query.q) filters['search'] = query.q;
    if (query.category) filters['category'] = query.category;
    if (query.language) filters['language'] = query.language;
    if (query.type) filters['type'] = query.type;
    if (query.tags) filters['tags'] = query.tags.split(',');
    if (query.minRating) filters['minRating'] = query.minRating;
    if (query.contentType) filters['contentType'] = query.contentType;
    return filters;
  }

  async getPopularContent(limit: number = 10) {
    const cacheKey = `popular:limit:${limit}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [popularPrograms, popularEpisodes] = await Promise.all([
      this.programRepository
        .createQueryBuilder('program')
        .where('1 = 1')
        .orderBy('program.viewCount', 'DESC')
        .addOrderBy('program.rating', 'DESC')
        .limit(limit)
        .getMany(),

      this.episodeRepository
        .createQueryBuilder('episode')
        .where('1 = 1')
        .orderBy('episode.viewCount', 'DESC')
        .limit(limit)
        .getMany(),
    ]);

    const result = { popularPrograms, popularEpisodes };
    this.cacheService.set(cacheKey, result, 600); // Cache for 10 minutes
    return result;
  }

  async getRecentContent(limit: number = 10) {
    const cacheKey = `recent:limit:${limit}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [recentPrograms, recentEpisodes] = await Promise.all([
      this.programRepository
        .createQueryBuilder('program')
        .where('1 = 1')
        .orderBy('program.publishDate', 'DESC')
        .limit(limit)
        .getMany(),

      this.episodeRepository
        .createQueryBuilder('episode')
        .where('1 = 1')
        .orderBy('episode.publishDate', 'DESC')
        .limit(limit)
        .getMany(),
    ]);

    const result = { recentPrograms, recentEpisodes };
    this.cacheService.set(cacheKey, result, 300); // Cache for 5 minutes
    return result;
  }
}
