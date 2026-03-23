import { IsBoolean, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreatePushSubscriptionDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  subscribeSpaceWeather?: boolean = true;

  @IsOptional()
  @IsBoolean()
  subscribeSatellitePass?: boolean = false;

  @IsOptional()
  @IsBoolean()
  subscribeIntelligence?: boolean = false;
}

export class UpdatePushSubscriptionDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  subscribeSpaceWeather?: boolean;

  @IsOptional()
  @IsBoolean()
  subscribeSatellitePass?: boolean;

  @IsOptional()
  @IsBoolean()
  subscribeIntelligence?: boolean;
}

export class PushSubscriptionResponseDto {
  id: string;
  email: string;
  subscribeSpaceWeather: boolean;
  subscribeSatellitePass: boolean;
  subscribeIntelligence: boolean;
  enabled: boolean;
  status: string;
  lastPushAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}