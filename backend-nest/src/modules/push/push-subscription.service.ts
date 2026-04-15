import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import type { DrizzleClient } from '../../db';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import {
  CreatePushSubscriptionDto,
  UpdatePushSubscriptionDto,
} from './dto/subscription.dto';

@Injectable()
export class PushSubscriptionService {
  private readonly logger = new Logger(PushSubscriptionService.name);

  constructor(@Inject(DRIZZLE) private db: DrizzleClient) {}

  async findByUserId(userId: string): Promise<schema.PushSubscription | null> {
    const [subscription] = await this.db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, userId));
    return subscription || null;
  }

  async create(
    userId: string,
    dto: CreatePushSubscriptionDto,
  ): Promise<schema.PushSubscription> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      if (existing.status === 'cancelled') {
        const [updated] = await this.db
          .update(schema.pushSubscriptions)
          .set({
            status: 'active',
            enabled: true,
            email: dto.email,
            subscriptionTypes:
              dto.subscriptionTypes?.join(',') || 'space_weather',
            updatedAt: new Date(),
          })
          .where(eq(schema.pushSubscriptions.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }

    const [subscription] = await this.db
      .insert(schema.pushSubscriptions)
      .values({
        userId,
        email: dto.email,
        subscriptionTypes: dto.subscriptionTypes?.join(',') || 'space_weather',
        status: 'active',
        enabled: true,
      })
      .returning();

    return subscription;
  }

  async update(
    userId: string,
    dto: UpdatePushSubscriptionDto,
  ): Promise<schema.PushSubscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    const updateData: Partial<schema.PushSubscription> = {
      updatedAt: new Date(),
    };

    if (dto.email !== undefined) {
      updateData.email = dto.email;
    }
    if (dto.subscriptionTypes !== undefined) {
      updateData.subscriptionTypes = dto.subscriptionTypes.join(',');
    }

    const [updated] = await this.db
      .update(schema.pushSubscriptions)
      .set(updateData)
      .where(eq(schema.pushSubscriptions.id, subscription.id))
      .returning();

    return updated;
  }

  async pause(userId: string): Promise<schema.PushSubscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    const [updated] = await this.db
      .update(schema.pushSubscriptions)
      .set({
        status: 'paused',
        enabled: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.pushSubscriptions.id, subscription.id))
      .returning();

    return updated;
  }

  async resume(userId: string): Promise<schema.PushSubscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    const [updated] = await this.db
      .update(schema.pushSubscriptions)
      .set({
        status: 'active',
        enabled: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.pushSubscriptions.id, subscription.id))
      .returning();

    return updated;
  }

  async cancel(userId: string): Promise<void> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('订阅不存在');
    }

    await this.db
      .update(schema.pushSubscriptions)
      .set({
        status: 'cancelled',
        enabled: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.pushSubscriptions.id, subscription.id));
  }

  hasSubscriptionType(
    subscription: schema.PushSubscription,
    type: string,
  ): boolean {
    return subscription.subscriptionTypes.split(',').includes(type);
  }
}
