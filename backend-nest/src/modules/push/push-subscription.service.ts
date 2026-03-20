import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscription } from '../../common/entities/push-subscription.entity';
import { PushSubscriptionStatus } from '../../common/enums';
import { CreatePushSubscriptionDto, UpdatePushSubscriptionDto } from './dto/subscription.dto';

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

  async create(userId: string, dto: CreatePushSubscriptionDto): Promise<PushSubscription> {
    // 检查是否已存在订阅
    const existing = await this.findByUserId(userId);
    if (existing) {
      // 如果已取消，重新激活
      if (existing.status === PushSubscriptionStatus.CANCELLED) {
        existing.status = PushSubscriptionStatus.ACTIVE;
        existing.enabled = true;
        existing.email = dto.email;
        existing.subscribeSpaceWeather = dto.subscribeSpaceWeather ?? true;
        existing.subscribeSatellitePass = dto.subscribeSatellitePass ?? false;
        return this.subscriptionRepository.save(existing);
      }
      return existing;
    }

    const subscription = this.subscriptionRepository.create({
      userId,
      email: dto.email,
      subscribeSpaceWeather: dto.subscribeSpaceWeather ?? true,
      subscribeSatellitePass: dto.subscribeSatellitePass ?? false,
      status: PushSubscriptionStatus.ACTIVE,
      enabled: true,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async update(userId: string, dto: UpdatePushSubscriptionDto): Promise<PushSubscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    if (dto.email !== undefined) {
      subscription.email = dto.email;
    }
    if (dto.subscribeSpaceWeather !== undefined) {
      subscription.subscribeSpaceWeather = dto.subscribeSpaceWeather;
    }
    if (dto.subscribeSatellitePass !== undefined) {
      subscription.subscribeSatellitePass = dto.subscribeSatellitePass;
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

  async updateLastPushAt(userId: string): Promise<void> {
    await this.subscriptionRepository.update(
      { userId },
      { lastPushAt: new Date() },
    );
  }

  async getActiveSubscriptions(): Promise<PushSubscription[]> {
    return this.subscriptionRepository.find({
      where: {
        status: PushSubscriptionStatus.ACTIVE,
        enabled: true,
      },
    });
  }
}