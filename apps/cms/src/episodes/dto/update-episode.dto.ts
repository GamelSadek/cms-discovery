import { IsString, IsNumber, IsOptional, Min, IsArray } from 'class-validator';

export class UpdateEpisodeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
