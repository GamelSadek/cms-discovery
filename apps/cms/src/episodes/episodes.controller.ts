import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EpisodesService } from './episodes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

interface EpisodeQueryDto {
  limit?: number;
  offset?: number;
  search?: string;
}

@ApiTags('Episodes')
@ApiBearerAuth()
@Controller('programs/:programId/episodes')
@UseGuards(JwtAuthGuard)
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new episode' })
  @ApiResponse({ status: 201, description: 'Episode created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid episode data' })
  @ApiResponse({ status: 403, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  create(
    @Param('programId', ParseUUIDPipe) programId: string,
    @Body() body: CreateEpisodeDto,
  ) {
    return this.episodesService.create(programId, body);
  }

  @Get()
  findAll(
    @Param('programId', ParseUUIDPipe) programId: string,
    @Query() query: EpisodeQueryDto,
  ) {
    return this.episodesService.findByProgram(programId, query);
  }

  @Get('all')
  findAllEpisodes(@Query() query: EpisodeQueryDto) {
    return this.episodesService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('programId', ParseUUIDPipe) programId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.episodesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('programId', ParseUUIDPipe) programId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateEpisodeDto,
  ) {
    return this.episodesService.update(id, body);
  }

  @Delete(':id')
  remove(
    @Param('programId', ParseUUIDPipe) programId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.episodesService.remove(id);
  }

  @Put(':id/publish')
  @ApiOperation({
    summary: 'Publish an episode',
    description: 'Publish an episode to make it available in Discovery service',
  })
  @ApiResponse({ status: 200, description: 'Episode published successfully' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async publishEpisode(@Param('id', ParseUUIDPipe) id: string) {
    return await this.episodesService.publish(id);
  }

  @Put(':id/unpublish')
  @ApiOperation({
    summary: 'Unpublish an episode',
    description: 'Unpublish an episode to remove it from Discovery service',
  })
  @ApiResponse({ status: 200, description: 'Episode unpublished successfully' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async unpublishEpisode(@Param('id', ParseUUIDPipe) id: string) {
    return await this.episodesService.unpublish(id);
  }
}
