import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import type { DrizzleClient } from '../../db';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface FeaturePermission {
  code: string;
  name: string;
  hasAccess: boolean;
  value?: string;
  displayText?: string;
}

export interface UserPermissions {
  level: string;
  levelName: string;
  features: FeaturePermission[];
}

@Injectable()
export class MembershipService {
  constructor(@Inject(DRIZZLE) private db: DrizzleClient) {}

  /**
   * 获取用户的功能权限列表
   */
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    // 获取用户信息
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    // 获取用户等级信息
    const [level] = await this.db
      .select()
      .from(schema.memberLevels)
      .where(eq(schema.memberLevels.code, user.level))
      .limit(1);

    // 获取所有权益定义（按分类排序）
    const allBenefits = await this.db
      .select()
      .from(schema.benefits)
      .orderBy(schema.benefits.category, schema.benefits.sortOrder);

    // 获取用户等级关联的权益
    const levelBenefits = await this.db
      .select()
      .from(schema.levelBenefits)
      .innerJoin(
        schema.memberLevels,
        eq(schema.levelBenefits.levelId, schema.memberLevels.id),
      )
      .where(eq(schema.memberLevels.code, user.level));

    const benefitIds = new Set(
      levelBenefits.map((lb) => lb.level_benefits.benefitId),
    );

    // 构建权限列表
    const features: FeaturePermission[] = allBenefits
      .filter((b) => b.code) // 只返回有 code 的权益（功能权限）
      .map((benefit) => {
        const levelBenefit = levelBenefits.find(
          (lb) => lb.level_benefits.benefitId === benefit.id,
        );
        return {
          code: benefit.code as string,
          name: benefit.name,
          hasAccess: benefitIds.has(benefit.id),
          value: levelBenefit?.level_benefits.value,
          displayText: levelBenefit?.level_benefits.displayText ?? undefined,
        };
      });

    return {
      level: user.level,
      levelName: level?.name || user.level,
      features,
    };
  }

  /**
   * 检查用户是否有某个功能权限
   */
  async hasFeature(userId: string, featureCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    if (!permissions) return false;

    const feature = permissions.features.find((f) => f.code === featureCode);
    return feature?.hasAccess ?? false;
  }
}
