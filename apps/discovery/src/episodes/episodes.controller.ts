import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EpisodesService } from './episodes.service';
import {
  PaginatedEpisodesResponseDto,
  EpisodeResponseDto,
} from './dto/episode-response.dto';

@ApiTags('episodes')
@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published episodes' })
  @ApiResponse({
    status: 200,
    description: 'Episodes retrieved successfully',
    type: PaginatedEpisodesResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('language') language?: string,
  ): Promise<PaginatedEpisodesResponseDto> {
    return this.episodesService.findAll(page, limit, category, language);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get episode by ID' })
  @ApiResponse({
    status: 200,
    description: 'Episode retrieved successfully',
    type: EpisodeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async findOne(@Param('id') id: string): Promise<EpisodeResponseDto> {
    return this.episodesService.findOne(id);
  }

  @Get('program/:programId')
  @ApiOperation({ summary: 'Get episodes by program ID' })
  @ApiResponse({
    status: 200,
    description: 'Episodes retrieved successfully',
    type: PaginatedEpisodesResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByProgram(
    @Param('programId') programId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PaginatedEpisodesResponseDto> {
    return this.episodesService.findByProgram(programId, page, limit);
  }
}
