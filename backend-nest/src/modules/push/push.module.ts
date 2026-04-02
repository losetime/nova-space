import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushController } from './push.controller';
import { PushSubscriptionService } from './push-subscription.service';
import { PushSubscription } from '../../common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription])],
  controllers: [PushController],
  providers: [PushSubscriptionService],
  exports: [PushSubscriptionService],
})
export class PushModule {}
