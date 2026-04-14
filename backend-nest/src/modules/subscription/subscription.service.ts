import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import type { DrizzleClient } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, desc, lt, gte, sql } from 'drizzle-orm';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';

@Injectable()
export class SubscriptionService {
  constructor(@Inject(DRIZZLE) private db: DrizzleClient) {}

  async create(
    userId: string,
    createDto: CreateSubscriptionDto,
  ): Promise<schema.Subscription> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [existingSubscription] = await this.db
      .select()
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.subscriptions.status, 'active')
        )
      );

    if (existingSubscription) {
      throw new BadRequestException('已有有效订阅');
    }

    const [subscription] = await this.db
      .insert(schema.subscriptions)
      .values({
        userId,
        status: 'active',
        plan: createDto.plan,
        price: String(createDto.price),
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        paymentMethod: createDto.paymentMethod,
        paymentId: createDto.paymentId,
        autoRenew: createDto.autoRenew ?? false,
      })
      .returning();

    const levelMap: Record<string, 'basic' | 'advanced' | 'professional'> = {
      monthly: 'advanced',
      quarterly: 'advanced',
      yearly: 'advanced',
      lifetime: 'professional',
      custom: 'professional',
    };

    await this.db
      .update(schema.users)
      .set({ level: levelMap[createDto.plan] || 'advanced' })
      .where(eq(schema.users.id, userId));

    return subscription;
  }

  async getCurrentSubscription(userId: string): Promise<schema.Subscription | null> {
    const [subscription] = await this.db
      .select()
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.subscriptions.status, 'active')
        )
      )
      .orderBy(desc(schema.subscriptions.endDate));
    return subscription || null;
  }

  async getSubscriptionHistory(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{ subscriptions: schema.Subscription[]; total: number }> {
    const offset = (page - 1) * limit;

    const subscriptions = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .orderBy(desc(schema.subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId));

    return { subscriptions, total: count };
  }

  async cancel(userId: string, cancelReason?: string): Promise<schema.Subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('没有有效订阅');
    }

    const [updated] = await this.db
      .update(schema.subscriptions)
      .set({
        autoRenew: false,
        cancelledAt: new Date(),
        cancelReason: cancelReason || '',
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.id, subscription.id))
      .returning();

    return updated;
  }

  async checkExpiredSubscriptions(): Promise<void> {
    const now = new Date();

    const expiredSubscriptions = await this.db
      .select()
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.status, 'active'),
          lt(schema.subscriptions.endDate, now)
        )
      );

    for (const subscription of expiredSubscriptions) {
      await this.db
        .update(schema.subscriptions)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(schema.subscriptions.id, subscription.id));

      await this.db
        .update(schema.users)
        .set({ level: 'basic' })
        .where(eq(schema.users.id, subscription.userId));
    }
  }

  async renew(
    userId: string,
    createDto: CreateSubscriptionDto,
  ): Promise<schema.Subscription> {
    const currentSubscription = await this.getCurrentSubscription(userId);

    if (currentSubscription) {
      const newEndDate = new Date(currentSubscription.endDate);

      switch (createDto.plan) {
        case 'monthly':
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          break;
        case 'quarterly':
          newEndDate.setMonth(newEndDate.getMonth() + 3);
          break;
        case 'yearly':
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          break;
        case 'lifetime':
          newEndDate.setFullYear(newEndDate.getFullYear() + 100);
          break;
      }

      const [updated] = await this.db
        .update(schema.subscriptions)
        .set({
          endDate: newEndDate,
          plan: createDto.plan,
          price: String(parseFloat(currentSubscription.price) + createDto.price),
          updatedAt: new Date(),
        })
        .where(eq(schema.subscriptions.id, currentSubscription.id))
        .returning();

      return updated;
    }

    return this.create(userId, createDto);
  }
}