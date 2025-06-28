import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { Program } from '../shared/entities/program.entity';

@ApiTags('programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published programs' })
  @ApiResponse({ status: 200, description: 'Programs retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('type') type?: string,
  ): Promise<{
    programs: Program[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.programsService.findAll(page, limit, category, language, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get program by ID' })
  @ApiResponse({ status: 200, description: 'Program retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async findOne(@Param('id') id: string): Promise<Program> {
    return this.programsService.findOne(id);
  }

  @Get(':id/episodes')
  @ApiOperation({ summary: 'Get episodes for a program' })
  @ApiResponse({ status: 200, description: 'Episodes retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEpisodes(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.programsService.getEpisodes(id, page, limit);
  }
}
