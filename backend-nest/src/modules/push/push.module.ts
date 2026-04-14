import { Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushSubscriptionService } from './push-subscription.service';

@Module({
  controllers: [PushController],
  providers: [PushSubscriptionService],
  exports: [PushSubscriptionService],
})
export class PushModule {}