import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import type { DrizzleClient } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  CreateNotificationDto,
  NotificationQueryDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(@Inject(DRIZZLE) private db: DrizzleClient) {}

  async create(dto: CreateNotificationDto): Promise<schema.Notification> {
    const [notification] = await this.db
      .insert(schema.notifications)
      .values(dto)
      .returning();
    return notification;
  }

  async createBatch(
    userIds: string[],
    dto: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<void> {
    const notifications = userIds.map((userId) => ({
      userId,
      type: dto.type,
      title: dto.title,
      content: dto.content,
      isRead: false,
      relatedId: dto.relatedId,
      relatedType: dto.relatedType,
    }));

    await this.db.insert(schema.notifications).values(notifications);
  }

  async findByUser(userId: string, query: NotificationQueryDto) {
    const { isRead, type, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(schema.notifications.userId, userId)];

    if (isRead !== undefined) {
      conditions.push(eq(schema.notifications.isRead, isRead));
    }

    if (type) {
      conditions.push(eq(schema.notifications.type, type));
    }

    const list = await this.db
      .select()
      .from(schema.notifications)
      .where(and(...conditions))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(...conditions));

    return {
      list,
      total: count,
      page,
      pageSize: limit,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false),
        ),
      );
    return count;
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, userId),
        ),
      );
    return (result as any).rowCount > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false),
        ),
      );
    return (result as any).rowCount;
  }

  async delete(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, userId),
        ),
      );
    return (result as any).rowCount > 0;
  }

  async clearRead(userId: string): Promise<number> {
    const result = await this.db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, true),
        ),
      );
    return (result as any).rowCount;
  }

  async notifyIntelligencePublish(
    intelligenceId: string,
    intelligenceTitle: string,
    subscriberIds: string[],
  ): Promise<void> {
    await this.createBatch(subscriberIds, {
      type: 'intelligence',
      title: '新情报发布',
      content: `您关注的领域有新情报发布：${intelligenceTitle}`,
      relatedId: intelligenceId,
      relatedType: 'intelligence',
    });
  }

  async sendSystemNotification(
    userIds: string[] | 'all',
    title: string,
    content: string,
  ): Promise<void> {
    if (userIds === 'all') {
      return;
    }
    await this.createBatch(userIds, {
      type: 'system',
      title,
      content,
    });
  }

  async sendAchievementNotification(
    userId: string,
    title: string,
    content: string,
  ): Promise<schema.Notification> {
    return this.create({
      userId,
      type: 'achievement',
      title,
      content,
    });
  }
}
