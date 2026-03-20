import { Injectable, Logger } from '@nestjs/common';
import { SpaceWeatherService } from '../space-weather/space-weather.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavorite } from '../../common/entities';
import { FavoriteType } from '../../common/enums';
import { PushSubscription } from '../../common/entities/push-subscription.entity';

interface DigestContent {
  weatherAlerts: any[];
  satellitePasses: any[];
  date: string;
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    private spaceWeatherService: SpaceWeatherService,
    @InjectRepository(UserFavorite)
    private favoriteRepository: Repository<UserFavorite>,
  ) {}

  async generateDigestContent(subscription: PushSubscription): Promise<DigestContent> {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content: DigestContent = {
      weatherAlerts: [],
      satellitePasses: [],
      date,
    };

    // 获取空间天气预警
    if (subscription.subscribeSpaceWeather) {
      try {
        const alerts = await this.spaceWeatherService.getAlerts(5);
        // 只保留高等级预警
        content.weatherAlerts = alerts.filter((alert: any) => alert.level >= 2);
      } catch (error) {
        this.logger.error('Failed to fetch weather alerts', error);
      }
    }

    // 获取用户关注的卫星过境信息
    if (subscription.subscribeSatellitePass) {
      try {
        const favorites = await this.favoriteRepository.find({
          where: {
            userId: subscription.userId,
            type: FavoriteType.SATELLITE,
          },
        });

        if (favorites.length > 0) {
          // TODO: 实现卫星过境计算
          // 这里需要根据卫星TLE数据和用户位置计算今日过境
          // 目前使用模拟数据
          content.satellitePasses = favorites.slice(0, 5).map((fav, index) => ({
            id: fav.targetId,
            name: `卫星 #${fav.targetId.slice(0, 8)}`,
            time: new Date(Date.now() + index * 3600000).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            maxElevation: Math.floor(Math.random() * 60 + 30),
          }));
        }
      } catch (error) {
        this.logger.error('Failed to fetch satellite passes', error);
      }
    }

    return content;
  }

  async getWeatherAlertsForPush(): Promise<any[]> {
    try {
      const alerts = await this.spaceWeatherService.getAlerts(10);
      // 只返回高等级预警
      return alerts.filter((alert: any) => alert.level >= 3);
    } catch (error) {
      this.logger.error('Failed to fetch weather alerts for push', error);
      return [];
    }
  }
}