import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Search query string' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Content category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Content language' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Preferred language for search results (ar/en)',
    enum: ['ar', 'en'],
  })
  @IsOptional()
  @IsIn(['ar', 'en'])
  locale?: string = 'ar';

  @ApiPropertyOptional({
    description: 'Content type',
    enum: ['podcast', 'documentary', 'series', 'movie'],
  })
  @IsOptional()
  @IsIn(['podcast', 'documentary', 'series', 'movie'])
  type?: string;

  @ApiPropertyOptional({ description: 'Tags (comma-separated)' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['relevance', 'date', 'title', 'rating', 'views'],
  })
  @IsOptional()
  @IsIn(['relevance', 'date', 'title', 'rating', 'views'])
  sortBy?: string = 'relevance';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Minimum rating (0-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Content to search in',
    enum: ['all', 'programs', 'episodes'],
  })
  @IsOptional()
  @IsIn(['all', 'programs', 'episodes'])
  contentType?: string = 'all';
}
