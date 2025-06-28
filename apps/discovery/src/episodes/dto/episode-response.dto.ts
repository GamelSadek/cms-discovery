import { ApiProperty } from '@nestjs/swagger';
import { Episode } from '../../shared/entities/episode.entity';

export class EpisodeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  episodeNumber: number;

  @ApiProperty({ required: false })
  seasonNumber?: number;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  processedMediaUrl?: string;

  @ApiProperty({ type: [String], required: false })
  tags?: string[];

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  rating: number;

  @ApiProperty({ required: false })
  publishDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedEpisodesResponseDto {
  @ApiProperty({ type: [EpisodeResponseDto] })
  episodes: EpisodeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
