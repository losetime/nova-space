import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import type { DrizzleClient } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, gte, lt, desc, sql } from 'drizzle-orm';
import { AddPointsDto, ConsumePointsDto, AdminGrantPointsDto } from './dto';
import { NotificationService } from '../notification/notification.service';

type PlanLevel = 'basic' | 'advanced' | 'professional';

@Injectable()
export class PointsService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleClient,
    private notificationService: NotificationService,
  ) {}

  private readonly pointsConfig = {
    register: 100,
    daily_login: 10,
    share: 5,
    invite: 50,
    task_complete: 20,
  };

  async exchangeMembership(userId: string, planCode: string) {
    const [plan] = await this.db
      .select()
      .from(schema.membershipPlans)
      .where(eq(schema.membershipPlans.planCode, planCode))
      .limit(1);

    if (!plan) {
      throw new NotFoundException('套餐不存在');
    }

    if (!plan.pointsPrice) {
      throw new BadRequestException('该套餐不支持积分兑换');
    }

    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.points < plan.pointsPrice) {
      throw new BadRequestException('积分不足');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const [subscription] = await this.db
      .insert(schema.subscriptions)
      .values({
        userId,
        plan: plan.planCode as
          | 'monthly'
          | 'quarterly'
          | 'yearly'
          | 'lifetime'
          | 'custom',
        status: 'active',
        price: '0',
        startDate,
        endDate,
        paymentMethod: 'points',
        paymentId: `points_${plan.pointsPrice}_${new Date().toISOString()}`,
      })
      .returning();

    await this.db
      .insert(schema.pointsRecords)
      .values({
        userId,
        points: -plan.pointsPrice,
        action: 'points_exchange_member',
        balance: String(user.points - plan.pointsPrice),
        description: `使用${plan.pointsPrice}积分兑换${plan.name}`,
        relatedId: subscription.id,
        relatedType: 'subscription',
      })
      .returning();

    await this.db
      .update(schema.users)
      .set({
        points: user.points - plan.pointsPrice,
        level: plan.level as PlanLevel,
      })
      .where(eq(schema.users.id, userId));

    await this.notificationService.sendMembershipNotification(
      userId,
      'points_exchange',
      {
        planName: plan.name,
        endDate: subscription.endDate,
        points: plan.pointsPrice,
        subscriptionId: subscription.id,
      },
    );

    await this.notificationService.sendPointsNotification(
      userId,
      'consumed',
      plan.pointsPrice,
      `兑换${plan.name}`,
    );

    return {
      subscription,
      newLevel: plan.level,
      pointsConsumed: plan.pointsPrice,
    };
  }

  async addPoints(
    userId: string,
    dto: AddPointsDto,
  ): Promise<schema.PointsRecord> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [record] = await this.db
      .insert(schema.pointsRecords)
      .values({
        userId,
        points: dto.points,
        action: dto.action,
        balance: String(user.points + dto.points),
        description: dto.description || this.getDefaultDescription(dto.action),
        relatedId: dto.relatedId,
        relatedType: dto.relatedType,
      })
      .returning();

    await this.db
      .update(schema.users)
      .set({
        points: user.points + dto.points,
        totalPoints: user.totalPoints + dto.points,
      })
      .where(eq(schema.users.id, userId));

    return record;
  }

  async consumePoints(
    userId: string,
    dto: ConsumePointsDto,
  ): Promise<schema.PointsRecord> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.points < dto.points) {
      throw new BadRequestException('积分不足');
    }

    const [record] = await this.db
      .insert(schema.pointsRecords)
      .values({
        userId,
        points: -dto.points,
        action: 'consume',
        balance: String(user.points - dto.points),
        description: dto.description,
        relatedId: dto.relatedId,
        relatedType: dto.relatedType,
      })
      .returning();

    await this.db
      .update(schema.users)
      .set({
        points: user.points - dto.points,
      })
      .where(eq(schema.users.id, userId));

    return record;
  }

  async getPointsHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ records: schema.PointsRecord[]; total: number }> {
    const offset = (page - 1) * limit;

    const records = await this.db
      .select()
      .from(schema.pointsRecords)
      .where(eq(schema.pointsRecords.userId, userId))
      .orderBy(desc(schema.pointsRecords.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.pointsRecords)
      .where(eq(schema.pointsRecords.userId, userId));

    return { records, total: count };
  }

  async dailyLoginReward(userId: string): Promise<schema.PointsRecord | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [existingRecord] = await this.db
      .select()
      .from(schema.pointsRecords)
      .where(
        and(
          eq(schema.pointsRecords.userId, userId),
          eq(schema.pointsRecords.action, 'daily_login'),
          gte(schema.pointsRecords.createdAt, today),
          lt(schema.pointsRecords.createdAt, tomorrow),
        ),
      );

    if (existingRecord) {
      return null;
    }

    return this.addPoints(userId, {
      points: this.pointsConfig['daily_login'],
      action: 'daily_login',
    });
  }

  async adminGrant(dto: AdminGrantPointsDto): Promise<schema.PointsRecord> {
    return this.addPoints(dto.userId, {
      points: dto.points,
      action: 'admin_grant',
      description: dto.description,
    });
  }

  async getPointsStats(userId: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [{ totalEarned }] = await this.db
      .select({ totalEarned: sql<number>`sum(points)` })
      .from(schema.pointsRecords)
      .where(
        and(
          eq(schema.pointsRecords.userId, userId),
          sql`${schema.pointsRecords.points} > 0`,
        ),
      );

    const [{ totalConsumed }] = await this.db
      .select({ totalConsumed: sql<number>`sum(abs(points))` })
      .from(schema.pointsRecords)
      .where(
        and(
          eq(schema.pointsRecords.userId, userId),
          sql`${schema.pointsRecords.points} < 0`,
        ),
      );

    const [{ checkinCount }] = await this.db
      .select({ checkinCount: sql<number>`count(*)` })
      .from(schema.pointsRecords)
      .where(
        and(
          eq(schema.pointsRecords.userId, userId),
          eq(schema.pointsRecords.action, 'daily_login'),
        ),
      );

    return {
      currentPoints: user.points,
      totalPoints: user.totalPoints,
      totalEarned: Number(totalEarned) || 0,
      totalConsumed: Number(totalConsumed) || 0,
      checkinDays: checkinCount,
    };
  }

  private getDefaultDescription(action: string): string {
    const descriptions: Record<string, string> = {
      register: '注册奖励',
      daily_login: '每日登录奖励',
      share: '分享奖励',
      invite: '邀请好友奖励',
      task_complete: '任务完成奖励',
      purchase: '购买获得积分',
      consume: '积分消费',
      admin_grant: '管理员发放',
      expire: '积分过期',
      points_exchange_member: '积分兑换会员',
    };
    return descriptions[action] || '积分变动';
  }
}
