import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';

export type IntelligenceCategory =
  | 'launch'
  | 'satellite'
  | 'industry'
  | 'research'
  | 'environment';
export type IntelligenceLevel = 'free' | 'advanced' | 'professional';

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

  @IsEnum(['launch', 'satellite', 'industry', 'research', 'environment'])
  category: IntelligenceCategory;

  @IsOptional()
  @IsEnum(['free', 'advanced', 'professional'])
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
