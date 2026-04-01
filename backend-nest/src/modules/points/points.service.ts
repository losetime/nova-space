import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointsRecord } from '../../common/entities/points-record.entity';
import { User } from '../../common/entities/user.entity';
import { PointsAction } from '../../common/enums/user.enum';
import { AddPointsDto, ConsumePointsDto, AdminGrantPointsDto } from './dto';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointsRecord)
    private pointsRecordRepository: Repository<PointsRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 积分配置
  private readonly pointsConfig = {
    [PointsAction.REGISTER]: 100,
    [PointsAction.DAILY_LOGIN]: 10,
    [PointsAction.SHARE]: 5,
    [PointsAction.INVITE]: 50,
    [PointsAction.TASK_COMPLETE]: 20,
  };

  // 添加积分
  async addPoints(userId: string, dto: AddPointsDto): Promise<PointsRecord> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const record = this.pointsRecordRepository.create({
      userId,
      points: dto.points,
      action: dto.action,
      balance: user.points + dto.points,
      description: dto.description || this.getDefaultDescription(dto.action),
      relatedId: dto.relatedId,
      relatedType: dto.relatedType,
    });

    user.points += dto.points;
    user.totalPoints += dto.points;

    await this.userRepository.save(user);
    return this.pointsRecordRepository.save(record);
  }

  // 消费积分
  async consumePoints(
    userId: string,
    dto: ConsumePointsDto,
  ): Promise<PointsRecord> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.points < dto.points) {
      throw new BadRequestException('积分不足');
    }

    const record = this.pointsRecordRepository.create({
      userId,
      points: -dto.points,
      action: PointsAction.CONSUME,
      balance: user.points - dto.points,
      description: dto.description,
      relatedId: dto.relatedId,
      relatedType: dto.relatedType,
    });

    user.points -= dto.points;

    await this.userRepository.save(user);
    return this.pointsRecordRepository.save(record);
  }

  // 获取积分记录
  async getPointsHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ records: PointsRecord[]; total: number }> {
    const [records, total] = await this.pointsRecordRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { records, total };
  }

  // 每日登录奖励
  async dailyLoginReward(userId: string): Promise<PointsRecord | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await this.pointsRecordRepository.findOne({
      where: {
        userId,
        action: PointsAction.DAILY_LOGIN,
        createdAt: Between(today, new Date()),
      },
    });

    if (existingRecord) {
      return null; // 今日已领取
    }

    return this.addPoints(userId, {
      points: this.pointsConfig[PointsAction.DAILY_LOGIN],
      action: PointsAction.DAILY_LOGIN,
    });
  }

  // 管理员发放积分
  async adminGrant(dto: AdminGrantPointsDto): Promise<PointsRecord> {
    return this.addPoints(dto.userId, {
      points: dto.points,
      action: PointsAction.ADMIN_GRANT,
      description: dto.description,
    });
  }

  // 获取用户积分统计
  async getPointsStats(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const totalEarned = await this.pointsRecordRepository
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId })
      .andWhere('record.points > 0')
      .select('SUM(record.points)', 'total')
      .getRawOne();

    const totalConsumed = await this.pointsRecordRepository
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId })
      .andWhere('record.points < 0')
      .select('SUM(ABS(record.points))', 'total')
      .getRawOne();

    // 获取签到天数
    const checkinCount = await this.pointsRecordRepository.count({
      where: { userId, action: PointsAction.DAILY_LOGIN },
    });

    return {
      currentPoints: user.points,
      totalPoints: user.totalPoints,
      totalEarned: Number(totalEarned.total) || 0,
      totalConsumed: Number(totalConsumed.total) || 0,
      checkinDays: checkinCount,
    };
  }

  private getDefaultDescription(action: PointsAction): string {
    const descriptions = {
      [PointsAction.REGISTER]: '注册奖励',
      [PointsAction.DAILY_LOGIN]: '每日登录奖励',
      [PointsAction.SHARE]: '分享奖励',
      [PointsAction.INVITE]: '邀请好友奖励',
      [PointsAction.TASK_COMPLETE]: '任务完成奖励',
      [PointsAction.PURCHASE]: '购买获得积分',
      [PointsAction.CONSUME]: '积分消费',
      [PointsAction.ADMIN_GRANT]: '管理员发放',
      [PointsAction.EXPIRE]: '积分过期',
    };
    return descriptions[action] || '积分变动';
  }
}

// 导入 Between
import { Between } from 'typeorm';
