import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export type NotificationType = 'intelligence' | 'system' | 'achievement';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(['intelligence', 'system', 'achievement'])
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsUUID()
  @IsOptional()
  relatedId?: string;

  @IsString()
  @IsOptional()
  relatedType?: string;
}

export class NotificationQueryDto {
  @IsOptional()
  isRead?: boolean;

  @IsOptional()
  @IsEnum(['intelligence', 'system', 'achievement'])
  type?: NotificationType;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}