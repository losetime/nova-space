import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Subscription } from '../../common/entities/subscription.entity';
import { User } from '../../common/entities/user.entity';
import {
  SubscriptionStatus,
  SubscriptionPlan,
  UserLevel,
} from '../../common/enums/user.enum';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 创建订阅
  async create(
    userId: string,
    createDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否已有有效订阅
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });

    if (existingSubscription) {
      throw new BadRequestException('已有有效订阅');
    }

    const subscription = this.subscriptionRepository.create({
      ...createDto,
      userId,
      status: SubscriptionStatus.ACTIVE,
    });

    // 更新用户等级
    const levelMap = {
      [SubscriptionPlan.MONTHLY]: UserLevel.ADVANCED,
      [SubscriptionPlan.QUARTERLY]: UserLevel.ADVANCED,
      [SubscriptionPlan.YEARLY]: UserLevel.ADVANCED,
      [SubscriptionPlan.LIFETIME]: UserLevel.PROFESSIONAL,
      [SubscriptionPlan.CUSTOM]: UserLevel.PROFESSIONAL,
    };

    user.level = levelMap[createDto.plan] || UserLevel.ADVANCED;
    await this.userRepository.save(user);

    return this.subscriptionRepository.save(subscription);
  }

  // 获取用户当前订阅
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { endDate: 'DESC' },
    });
  }

  // 获取用户订阅历史
  async getSubscriptionHistory(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ subscriptions: Subscription[]; total: number }> {
    const [subscriptions, total] =
      await this.subscriptionRepository.findAndCount({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

    return { subscriptions, total };
  }

  // 取消订阅
  async cancel(userId: string, cancelReason?: string): Promise<Subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('没有有效订阅');
    }

    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    subscription.cancelReason = cancelReason || '';

    return this.subscriptionRepository.save(subscription);
  }

  // 检查并更新过期订阅
  async checkExpiredSubscriptions(): Promise<void> {
    const now = new Date();
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: Between(new Date(0), now),
      },
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);

      // 更新用户等级
      const user = await this.userRepository.findOne({
        where: { id: subscription.userId },
      });
      if (user) {
        user.level = UserLevel.BASIC;
        await this.userRepository.save(user);
      }
    }
  }

  // 续费
  async renew(
    userId: string,
    createDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const currentSubscription = await this.getCurrentSubscription(userId);

    if (currentSubscription) {
      // 延长现有订阅
      const newEndDate = new Date(currentSubscription.endDate);
      const startDate = new Date(createDto.startDate);

      switch (createDto.plan) {
        case SubscriptionPlan.MONTHLY:
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          break;
        case SubscriptionPlan.QUARTERLY:
          newEndDate.setMonth(newEndDate.getMonth() + 3);
          break;
        case SubscriptionPlan.YEARLY:
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          break;
        case SubscriptionPlan.LIFETIME:
          newEndDate.setFullYear(newEndDate.getFullYear() + 100);
          break;
      }

      currentSubscription.endDate = newEndDate;
      currentSubscription.plan = createDto.plan;
      currentSubscription.price += createDto.price;

      return this.subscriptionRepository.save(currentSubscription);
    }

    // 创建新订阅
    return this.create(userId, createDto);
  }
}
