import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Intelligence,
  IntelligenceCategory,
  IntelligenceLevel,
} from './entities/intelligence.entity';
import { IntelligenceCollect } from './entities/intelligence-collect.entity';
import { CreateIntelligenceDto } from './dto/create-intelligence.dto';
import { QueryIntelligenceDto } from './dto/query-intelligence.dto';

@Injectable()
export class IntelligenceService {
  constructor(
    @InjectRepository(Intelligence)
    private intelligenceRepository: Repository<Intelligence>,
    @InjectRepository(IntelligenceCollect)
    private collectRepository: Repository<IntelligenceCollect>,
  ) {}

  // 获取情报列表
  async findAll(query: QueryIntelligenceDto, userLevel?: string) {
    const { category, page = 1, pageSize = 12 } = query;

    const qb = this.intelligenceRepository.createQueryBuilder('intel');

    if (category) {
      qb.andWhere('intel.category = :category', { category });
    }

    // 根据用户等级过滤可见情报
    if (userLevel === 'professional') {
      // 专业会员可见所有
    } else if (userLevel === 'advanced') {
      qb.andWhere('intel.level IN (:...levels)', {
        levels: [IntelligenceLevel.FREE, IntelligenceLevel.ADVANCED],
      });
    } else {
      qb.andWhere('intel.level = :level', { level: IntelligenceLevel.FREE });
    }

    qb.orderBy('intel.publishedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return {
      list: list.map((item) => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
        isLocked:
          userLevel === 'basic' && item.level !== IntelligenceLevel.FREE,
      })),
      total,
      page,
      pageSize,
    };
  }

  // 获取情报详情
  async findOne(id: number, userId?: string) {
    const intelligence = await this.intelligenceRepository.findOne({
      where: { id },
    });

    if (!intelligence) {
      return null;
    }

    // 增加浏览量
    await this.intelligenceRepository.increment({ id }, 'views', 1);

    // 检查是否已收藏
    let isCollected = false;
    if (userId) {
      const collect = await this.collectRepository.findOne({
        where: { userId, intelligenceId: id },
      });
      isCollected = !!collect;
    }

    return {
      ...intelligence,
      tags: intelligence.tags ? JSON.parse(intelligence.tags) : [],
      isCollected,
    };
  }

  // 获取热门排行
  async getHotList(limit: number = 5) {
    const list = await this.intelligenceRepository.find({
      order: { views: 'DESC' },
      take: limit,
    });

    return list.map((item) => ({
      id: item.id,
      title: item.title,
      views: item.views,
    }));
  }

  // 收藏情报
  async collect(userId: string, intelligenceId: number) {
    const existing = await this.collectRepository.findOne({
      where: { userId, intelligenceId },
    });

    if (existing) {
      // 取消收藏
      await this.collectRepository.remove(existing);
      await this.intelligenceRepository.decrement(
        { id: intelligenceId },
        'collects',
        1,
      );
      return { collected: false };
    } else {
      // 添加收藏
      const collect = this.collectRepository.create({
        userId,
        intelligenceId,
      });
      await this.collectRepository.save(collect);
      await this.intelligenceRepository.increment(
        { id: intelligenceId },
        'collects',
        1,
      );
      return { collected: true };
    }
  }

  // 获取用户收藏列表
  async getUserCollects(userId: string) {
    const collects = await this.collectRepository.find({
      where: { userId },
      relations: ['intelligence'],
      order: { createdAt: 'DESC' },
    });

    return collects.map((c) => ({
      ...c.intelligence,
      tags: c.intelligence.tags ? JSON.parse(c.intelligence.tags) : [],
      collectedAt: c.createdAt,
    }));
  }

  // 创建情报（管理功能）
  async create(dto: CreateIntelligenceDto) {
    const intelligence = this.intelligenceRepository.create(dto);
    return this.intelligenceRepository.save(intelligence);
  }
}
