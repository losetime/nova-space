import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserLevel } from '../enums/user.enum';

@Injectable()
export class LevelGuard implements CanActivate {
  constructor(private requiredLevel: UserLevel) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('请先登录');
    }

    const levelPriority: Record<UserLevel, number> = {
      [UserLevel.BASIC]: 1,
      [UserLevel.ADVANCED]: 2,
      [UserLevel.PROFESSIONAL]: 3,
    };

    const userLevel = user.level as UserLevel;
    const userLevelPriority = levelPriority[userLevel] || 0;
    const requiredLevelPriority = levelPriority[this.requiredLevel] || 0;

    if (userLevelPriority < requiredLevelPriority) {
      throw new ForbiddenException('您的会员等级不足');
    }

    return true;
  }
}

// 装饰器工厂函数
export const RequireLevel = (level: UserLevel) => {
  return {
    provide: 'LEVEL_GUARD',
    useFactory: () => new LevelGuard(level),
  };
};
