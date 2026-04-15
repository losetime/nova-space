import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export type IntelligenceCategory =
  | 'launch'
  | 'satellite'
  | 'industry'
  | 'research'
  | 'environment';

export class QueryIntelligenceDto {
  @IsOptional()
  @IsEnum(['launch', 'satellite', 'industry', 'research', 'environment'])
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
