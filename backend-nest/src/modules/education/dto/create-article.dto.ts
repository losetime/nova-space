import { IsString, IsEnum, IsOptional, IsInt, Min, IsArray } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsEnum(['basic', 'advanced', 'mission', 'people'])
  category: string;

  @IsEnum(['article', 'video'])
  type: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}