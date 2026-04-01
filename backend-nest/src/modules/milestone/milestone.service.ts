import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Milestone, MilestoneCategory } from './entities/milestone.entity';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  QueryMilestoneDto,
} from './dto/milestone.dto';

@Injectable()
export class MilestoneService {
  constructor(
    @InjectRepository(Milestone)
    private milestoneRepository: Repository<Milestone>,
  ) {}

  // 获取里程碑列表（时间线）
  async findAll(query: QueryMilestoneDto) {
    const {
      category,
      page = 1,
      pageSize = 12,
      sortBy = 'eventDate',
      sortOrder = 'DESC',
    } = query;

    const qb = this.milestoneRepository.createQueryBuilder('milestone');
    qb.where('milestone.isPublished = :isPublished', { isPublished: true });

    if (category) {
      qb.andWhere('milestone.category = :category', { category });
    }

    qb.orderBy(`milestone.${sortBy}`, sortOrder)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  // 按年代分组获取里程碑
  async getTimelineByDecade() {
    const milestones = await this.milestoneRepository
      .createQueryBuilder('milestone')
      .where('milestone.isPublished = :isPublished', { isPublished: true })
      .orderBy('milestone.eventDate', 'DESC')
      .getMany();

    const decadeMap = new Map<string, Milestone[]>();

    milestones.forEach((milestone) => {
      const year = new Date(milestone.eventDate).getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      if (!decadeMap.has(decade)) {
        decadeMap.set(decade, []);
      }
      decadeMap.get(decade)!.push(milestone);
    });

    // 按年代排序
    const sortedDecades = Array.from(decadeMap.keys()).sort((a, b) => {
      const aDecade = parseInt(a.replace('s', ''));
      const bDecade = parseInt(b.replace('s', ''));
      return bDecade - aDecade;
    });

    return sortedDecades.map((decade) => ({
      decade,
      items: decadeMap.get(decade)!,
    }));
  }

  // 获取里程碑详情
  async findOne(id: number) {
    const milestone = await this.milestoneRepository.findOne({
      where: { id },
    });

    if (!milestone) {
      throw new NotFoundException(`里程碑 ${id} 不存在`);
    }

    return milestone;
  }

  // 创建里程碑（管理员）
  async create(dto: CreateMilestoneDto) {
    const milestone = this.milestoneRepository.create({
      ...dto,
      eventDate: new Date(dto.eventDate),
    });
    return this.milestoneRepository.save(milestone);
  }

  // 更新里程碑（管理员）
  async update(id: number, dto: UpdateMilestoneDto) {
    const milestone = await this.findOne(id);

    Object.assign(milestone, dto);
    if (dto.eventDate) {
      milestone.eventDate = new Date(dto.eventDate);
    }

    return this.milestoneRepository.save(milestone);
  }

  // 删除里程碑（管理员）
  async remove(id: number) {
    const milestone = await this.findOne(id);
    await this.milestoneRepository.remove(milestone);
    return { success: true };
  }

  // 获取所有分类
  async getCategories() {
    const categories = await this.milestoneRepository
      .createQueryBuilder('milestone')
      .select('milestone.category', 'category')
      .addSelect('COUNT(milestone.id)', 'count')
      .where('milestone.isPublished = :isPublished', { isPublished: true })
      .groupBy('milestone.category')
      .getRawMany();

    return categories.map((c) => ({
      category: c.category as MilestoneCategory,
      count: parseInt(c.count),
    }));
  }

  // 获取重要里程碑（用于首页展示）
  async getFeatured(limit = 5) {
    return this.milestoneRepository
      .createQueryBuilder('milestone')
      .where('milestone.isPublished = :isPublished', { isPublished: true })
      .andWhere('milestone.importance >= :minImportance', { minImportance: 4 })
      .orderBy('milestone.importance', 'DESC')
      .addOrderBy('milestone.eventDate', 'DESC')
      .take(limit)
      .getMany();
  }
}
