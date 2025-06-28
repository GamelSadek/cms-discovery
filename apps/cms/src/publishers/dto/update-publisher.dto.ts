import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdatePublisherDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
