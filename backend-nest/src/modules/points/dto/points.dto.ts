import {
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

export type PointsActionType =
  | 'register'
  | 'daily_login'
  | 'share'
  | 'invite'
  | 'task_complete'
  | 'purchase'
  | 'consume'
  | 'admin_grant'
  | 'expire';

export class AddPointsDto {
  @IsNumber()
  points: number;

  @IsEnum([
    'register',
    'daily_login',
    'share',
    'invite',
    'task_complete',
    'purchase',
    'consume',
    'admin_grant',
    'expire',
  ])
  action: PointsActionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  @IsString()
  relatedType?: string;
}

export class ConsumePointsDto {
  @IsNumber()
  points: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  @IsString()
  relatedType?: string;
}

export class AdminGrantPointsDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  points: number;

  @IsString()
  description: string;
}
