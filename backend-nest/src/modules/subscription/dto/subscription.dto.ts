import {
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export type SubscriptionPlanType = 'monthly' | 'quarterly' | 'yearly' | 'lifetime' | 'custom';

export class CreateSubscriptionDto {
  @IsEnum(['monthly', 'quarterly', 'yearly', 'lifetime', 'custom'])
  plan: SubscriptionPlanType;

  @IsNumber()
  price: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}
