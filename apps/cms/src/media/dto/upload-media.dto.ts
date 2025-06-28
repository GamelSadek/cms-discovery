import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChapterDto {
  @ApiProperty({ description: 'Chapter title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Start time in seconds' })
  @IsNumber()
  @Min(0)
  startTime: number;

  @ApiProperty({ description: 'End time in seconds' })
  @IsNumber()
  @Min(0)
  endTime: number;

  @ApiPropertyOptional({ description: 'Chapter description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class MediaMetadataDto {
  @ApiPropertyOptional({ description: 'Video width in pixels' })
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ description: 'Video height in pixels' })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ description: 'Bitrate in kbps' })
  @IsNumber()
  @IsOptional()
  bitrate?: number;

  @ApiPropertyOptional({ description: 'Codec used' })
  @IsString()
  @IsOptional()
  codec?: string;

  @ApiPropertyOptional({ description: 'Quality setting' })
  @IsString()
  @IsOptional()
  quality?: string;

  @ApiPropertyOptional({ description: 'Frame rate' })
  @IsNumber()
  @IsOptional()
  frameRate?: number;

  @ApiPropertyOptional({ description: 'Audio channels' })
  @IsNumber()
  @IsOptional()
  audioChannels?: number;

  @ApiPropertyOptional({ description: 'Sample rate' })
  @IsNumber()
  @IsOptional()
  sampleRate?: number;
}

export class UploadMediaDto {
  @ApiProperty({ description: 'Media title (العنوان)' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Media description (الوصف)' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Media category (التصنيف)',
    example: 'podcast',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Media language (اللغة)', example: 'ar' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds (المدة)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Publish date (تاريخ النشر)' })
  @IsDateString()
  @IsOptional()
  publishDate?: string;

  @ApiPropertyOptional({ description: 'Episode number' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  episodeNumber?: number;

  @ApiPropertyOptional({ description: 'Season number' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  seasonNumber?: number;

  @ApiPropertyOptional({ description: 'Tags for the media' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Media chapters (الفصول)',
    type: [ChapterDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterDto)
  @IsOptional()
  chapters?: ChapterDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @ValidateNested()
  @Type(() => MediaMetadataDto)
  @IsOptional()
  metadata?: MediaMetadataDto;

  @ApiPropertyOptional({ description: 'Program ID this media belongs to' })
  @IsUUID()
  @IsOptional()
  programId?: string;
}
