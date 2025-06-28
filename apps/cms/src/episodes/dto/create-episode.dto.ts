import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsUrl,
  IsDateString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EpisodeStatus } from '../episode.entity';

class ChapterDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(0)
  startTime: number;

  @IsNumber()
  @Min(0)
  endTime: number;
}

export class CreateEpisodeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  titleAr?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsNumber()
  @Min(1)
  duration: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  episodeNumber?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  seasonNumber?: number;

  @IsEnum(EpisodeStatus)
  @IsOptional()
  status?: EpisodeStatus;

  @IsUrl()
  @IsOptional()
  originalMediaUrl?: string;

  @IsUrl()
  @IsOptional()
  processedMediaUrl?: string;

  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsDateString()
  @IsOptional()
  publishDate?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterDto)
  @IsOptional()
  chapters?: ChapterDto[];

  @IsUUID()
  @IsNotEmpty()
  programId: string;
}
