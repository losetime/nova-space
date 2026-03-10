import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IntelligenceCategory } from '../entities/intelligence.entity';

export class QueryIntelligenceDto {
  @IsOptional()
  @IsEnum(IntelligenceCategory)
  category?: IntelligenceCategory;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}