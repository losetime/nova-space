import { IsNumber, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PointsAction } from '../../../common/enums/user.enum';

export class AddPointsDto {
  @IsNumber()
  points: number;

  @IsEnum(PointsAction)
  action: PointsAction;

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