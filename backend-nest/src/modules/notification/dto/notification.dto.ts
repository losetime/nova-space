import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(NotificationType)
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
  type?: NotificationType;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
