import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PushSubscriptionService } from './push-subscription.service';
import { EmailService } from './email.service';
import { DigestService } from './digest.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushRecord } from '../../common/entities';
import { PushTriggerType, PushRecordStatus } from '../../common/enums';

@Injectable()
export class PushSchedulerService {
  private readonly logger = new Logger(PushSchedulerService.name);
  private isRunning = false;

  constructor(
    private subscriptionService: PushSubscriptionService,
    private emailService: EmailService,
    private digestService: DigestService,
    @InjectRepository(PushRecord)
    private pushRecordRepository: Repository<PushRecord>,
  ) {}

  // 每日早8点推送
  @Cron('0 8 * * *', {
    timeZone: 'Asia/Shanghai',
  })
  async sendDailyDigest(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Daily digest job is already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting daily digest push...');

    try {
      const subscriptions =
        await this.subscriptionService.getActiveSubscriptions();
      this.logger.log(`Found ${subscriptions.length} active subscriptions`);

      for (const subscription of subscriptions) {
        try {
          // 检查今日是否已发送
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const existingRecord = await this.pushRecordRepository.findOne({
            where: {
              userId: subscription.userId,
              triggerType: PushTriggerType.SCHEDULED,
              createdAt: { $gte: today } as any,
            },
          });

          if (existingRecord) {
            this.logger.debug(
              `User ${subscription.userId} already received digest today`,
            );
            continue;
          }

          // 生成汇总内容
          const content =
            await this.digestService.generateDigestContent(subscription);

          // 发送邮件
          const sent = await this.emailService.sendDailyDigest(
            subscription.email,
            content,
          );

          // 记录推送结果
          const record = this.pushRecordRepository.create({
            userId: subscription.userId,
            triggerType: PushTriggerType.SCHEDULED,
            subject: `Nova Space 每日资讯 - ${content.date}`,
            content: JSON.stringify(content),
            sentAt: new Date(),
            status: sent ? PushRecordStatus.SENT : PushRecordStatus.FAILED,
          });

          await this.pushRecordRepository.save(record);

          if (sent) {
            await this.subscriptionService.updateLastPushAt(
              subscription.userId,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to send digest to user ${subscription.userId}`,
            error,
          );
        }
      }

      this.logger.log('Daily digest push completed');
    } finally {
      this.isRunning = false;
    }
  }

  // 手动触发推送（用于测试或管理员操作）
  async triggerManualPush(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionService.findByUserId(userId);
    if (!subscription) {
      this.logger.warn(`No subscription found for user ${userId}`);
      return false;
    }

    try {
      const content =
        await this.digestService.generateDigestContent(subscription);
      const sent = await this.emailService.sendDailyDigest(
        subscription.email,
        content,
      );

      // 记录推送结果
      const record = this.pushRecordRepository.create({
        userId,
        triggerType: PushTriggerType.MANUAL,
        subject: `Nova Space 测试推送 - ${content.date}`,
        content: JSON.stringify(content),
        sentAt: new Date(),
        status: sent ? PushRecordStatus.SENT : PushRecordStatus.FAILED,
      });

      await this.pushRecordRepository.save(record);

      if (sent) {
        await this.subscriptionService.updateLastPushAt(userId);
      }

      return sent;
    } catch (error) {
      this.logger.error(`Failed to send manual push to user ${userId}`, error);
      return false;
    }
  }
}
