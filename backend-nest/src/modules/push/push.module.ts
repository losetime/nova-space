import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushController } from './push.controller';
import { PushSubscriptionService } from './push-subscription.service';
import { EmailService } from './email.service';
import { DigestService } from './digest.service';
import { PushSchedulerService } from './push-scheduler.service';
import { PushSubscription, PushRecord } from '../../common/entities';
import { SpaceWeatherModule } from '../space-weather/space-weather.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushSubscription, PushRecord]),
    SpaceWeatherModule,
    IntelligenceModule,
  ],
  controllers: [PushController],
  providers: [
    PushSubscriptionService,
    EmailService,
    DigestService,
    PushSchedulerService,
  ],
  exports: [PushSubscriptionService, PushSchedulerService],
})
export class PushModule {}
