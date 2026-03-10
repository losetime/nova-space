import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { IntelligenceCategory, IntelligenceLevel } from '../entities/intelligence.entity';

export class CreateIntelligenceDto {
  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsEnum(IntelligenceCategory)
  category: IntelligenceCategory;

  @IsOptional()
  @IsEnum(IntelligenceLevel)
  level?: IntelligenceLevel;

  @IsString()
  source: string;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  analysis?: string;

  @IsOptional()
  @IsString()
  trend?: string;
}