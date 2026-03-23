import { IsEmail, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';
import { SubscriptionType } from '../../../common/enums';

export class CreatePushSubscriptionDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  subscriptionTypes?: SubscriptionType[];
}

export class UpdatePushSubscriptionDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  subscriptionTypes?: SubscriptionType[];
}

export class PushSubscriptionResponseDto {
  id: string;
  email: string;
  subscriptionTypes: SubscriptionType[];
  enabled: boolean;
  status: string;
  lastPushAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}