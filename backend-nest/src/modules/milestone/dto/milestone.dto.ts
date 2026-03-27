import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { MilestoneCategory } from '../entities/milestone.entity';

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @IsEnum(MilestoneCategory)
  @IsOptional()
  category?: MilestoneCategory;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsOptional()
  media?: any;

  @IsString()
  @IsOptional()
  relatedSatelliteNoradId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  importance?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsString()
  @IsOptional()
  isPublished?: boolean;
}

export class UpdateMilestoneDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @IsEnum(MilestoneCategory)
  @IsOptional()
  category?: MilestoneCategory;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsOptional()
  media?: any;

  @IsString()
  @IsOptional()
  relatedSatelliteNoradId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  importance?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsString()
  @IsOptional()
  isPublished?: boolean;
}

export class QueryMilestoneDto {
  @IsOptional()
  @IsEnum(MilestoneCategory)
  category?: MilestoneCategory;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  pageSize?: number = 12;

  @IsOptional()
  sortBy?: 'eventDate' | 'importance' | 'createdAt' = 'eventDate';

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
