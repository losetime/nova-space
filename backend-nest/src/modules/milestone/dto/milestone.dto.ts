import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export type MilestoneCategory =
  | 'launch'
  | 'recovery'
  | 'orbit'
  | 'mission'
  | 'other';
export type MediaItem = {
  type: 'image' | 'video';
  url: string;
  caption?: string;
};

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

  @IsEnum(['launch', 'recovery', 'orbit', 'mission', 'other'])
  @IsOptional()
  category?: MilestoneCategory;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsOptional()
  media?: MediaItem[];

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

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1)
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

  @IsEnum(['launch', 'recovery', 'orbit', 'mission', 'other'])
  @IsOptional()
  category?: MilestoneCategory;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsOptional()
  media?: MediaItem[];

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

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1)
  isPublished?: boolean;
}

export class QueryMilestoneDto {
  @IsOptional()
  @IsEnum(['launch', 'recovery', 'orbit', 'mission', 'other'])
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
