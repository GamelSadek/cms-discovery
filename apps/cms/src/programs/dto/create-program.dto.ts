import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsUrl,
  Min,
  Max,
} from 'class-validator';
import { ProgramType, ProgramStatus } from '../programs.entity';

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  titleAr?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  shortDescriptionAr?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsEnum(ProgramType)
  @IsOptional()
  type?: ProgramType;

  @IsEnum(ProgramStatus)
  @IsOptional()
  status?: ProgramStatus;

  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @IsUrl()
  @IsOptional()
  coverImageUrl?: string;

  @IsUrl()
  @IsOptional()
  trailerUrl?: string;

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

  @IsString()
  @IsNotEmpty()
  publisherId: string;
}
