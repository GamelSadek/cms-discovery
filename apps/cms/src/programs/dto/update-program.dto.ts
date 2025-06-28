import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateProgramDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsDateString()
  @IsOptional()
  publishDate?: Date;
}
