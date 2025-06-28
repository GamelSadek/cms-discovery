import { ApiProperty } from '@nestjs/swagger';

export class ProgramResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  shortDescription?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  coverImageUrl?: string;

  @ApiProperty({ required: false })
  trailerUrl?: string;

  @ApiProperty({ type: [String], required: false })
  tags?: string[];

  @ApiProperty()
  episodeCount: number;

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

export class PaginatedProgramsResponseDto {
  @ApiProperty({ type: [ProgramResponseDto] })
  programs: ProgramResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
