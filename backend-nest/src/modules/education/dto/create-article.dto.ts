import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';

export type ArticleCategory = 'basic' | 'advanced' | 'mission' | 'people';
export type ArticleType = 'article' | 'video';

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
  category: ArticleCategory;

  @IsEnum(['article', 'video'])
  type: ArticleType;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
