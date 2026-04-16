import { Module } from '@nestjs/common';
import { MembershipSchedulerService } from './membership-scheduler.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [MembershipSchedulerService],
})
export class MembershipSchedulerModule {}