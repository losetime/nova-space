import {
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { SubscriptionPlan } from '../../../common/enums/user.enum';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

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
