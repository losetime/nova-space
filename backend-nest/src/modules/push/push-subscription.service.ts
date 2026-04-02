import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscription } from '../../common/entities/push-subscription.entity';
import { PushSubscriptionStatus, SubscriptionType } from '../../common/enums';
import {
  CreatePushSubscriptionDto,
  UpdatePushSubscriptionDto,
} from './dto/subscription.dto';

@Injectable()
export class PushSubscriptionService {
  private readonly logger = new Logger(PushSubscriptionService.name);

  constructor(
    @InjectRepository(PushSubscription)
    private subscriptionRepository: Repository<PushSubscription>,
  ) {}

  async findByUserId(userId: string): Promise<PushSubscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId },
    });
  }

  async create(
    userId: string,
    dto: CreatePushSubscriptionDto,
  ): Promise<PushSubscription> {
    // 检查是否已存在订阅
    const existing = await this.findByUserId(userId);
    if (existing) {
      // 如果已取消，重新激活
      if (existing.status === PushSubscriptionStatus.CANCELLED) {
        existing.status = PushSubscriptionStatus.ACTIVE;
        existing.enabled = true;
        existing.email = dto.email;
        existing.subscriptionTypes = dto.subscriptionTypes ?? [
          SubscriptionType.SPACE_WEATHER,
        ];
        return this.subscriptionRepository.save(existing);
      }
      return existing;
    }

    const subscription = this.subscriptionRepository.create({
      userId,
      email: dto.email,
      subscriptionTypes: dto.subscriptionTypes ?? [
        SubscriptionType.SPACE_WEATHER,
      ],
      status: PushSubscriptionStatus.ACTIVE,
      enabled: true,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async update(
    userId: string,
    dto: UpdatePushSubscriptionDto,
  ): Promise<PushSubscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    if (dto.email !== undefined) {
      subscription.email = dto.email;
    }
    if (dto.subscriptionTypes !== undefined) {
      subscription.subscriptionTypes = dto.subscriptionTypes;
    }

    return this.subscriptionRepository.save(subscription);
  }

  async pause(userId: string): Promise<PushSubscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    subscription.status = PushSubscriptionStatus.PAUSED;
    subscription.enabled = false;

    return this.subscriptionRepository.save(subscription);
  }

  async resume(userId: string): Promise<PushSubscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    subscription.status = PushSubscriptionStatus.ACTIVE;
    subscription.enabled = true;

    return this.subscriptionRepository.save(subscription);
  }

  async cancel(userId: string): Promise<void> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    subscription.status = PushSubscriptionStatus.CANCELLED;
    subscription.enabled = false;

    await this.subscriptionRepository.save(subscription);
  }

  // 检查是否订阅了指定类型
  hasSubscriptionType(
    subscription: PushSubscription,
    type: SubscriptionType,
  ): boolean {
    return subscription.subscriptionTypes.includes(type);
  }
}
