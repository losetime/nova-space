import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto, NotificationQueryDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  // 创建通知
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  // 批量创建通知（给多个用户推送）
  async createBatch(userIds: string[], dto: Omit<CreateNotificationDto, 'userId'>): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        ...dto,
        userId,
      }),
    );
    await this.notificationRepository.save(notifications);
  }

  // 获取用户通知列表
  async findByUser(userId: string, query: NotificationQueryDto) {
    const { isRead, type, page = 1, limit = 20 } = query;
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (isRead !== undefined) {
      qb.andWhere('notification.isRead = :isRead', { isRead });
    }

    if (type) {
      qb.andWhere('notification.type = :type', { type });
    }

    const [list, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize: limit,
    };
  }

  // 获取未读数量
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // 标记单条已读
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );
    return (result.affected ?? 0) > 0;
  }

  // 标记全部已读
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return result.affected ?? 0;
  }

  // 删除通知
  async delete(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });
    return (result.affected ?? 0) > 0;
  }

  // 清空已读通知
  async clearRead(userId: string): Promise<number> {
    const result = await this.notificationRepository.delete({
      userId,
      isRead: true,
    });
    return result.affected ?? 0;
  }

  // 情报发布时推送通知给订阅用户
  async notifyIntelligencePublish(
    intelligenceId: string,
    intelligenceTitle: string,
    subscriberIds: string[],
  ): Promise<void> {
    await this.createBatch(subscriberIds, {
      type: NotificationType.INTELLIGENCE,
      title: '新情报发布',
      content: `您关注的领域有新情报发布：${intelligenceTitle}`,
      relatedId: intelligenceId,
      relatedType: 'intelligence',
    });
  }

  // 系统通知
  async sendSystemNotification(
    userIds: string[] | 'all',
    title: string,
    content: string,
  ): Promise<void> {
    if (userIds === 'all') {
      // 如果需要给所有用户发送，需要先查询所有用户ID
      // 这里简化处理，实际应该通过 User 模块获取
      return;
    }
    await this.createBatch(userIds, {
      type: NotificationType.SYSTEM,
      title,
      content,
    });
  }

  // 成就通知
  async sendAchievementNotification(
    userId: string,
    title: string,
    content: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.ACHIEVEMENT,
      title,
      content,
    });
  }
}