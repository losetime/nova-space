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
}

export class PushSubscriptionResponseDto {
  id: string;
  email: string;
  subscribeSpaceWeather: boolean;
  subscribeSatellitePass: boolean;
  enabled: boolean;
  status: string;
  lastPushAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}