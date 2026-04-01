import { Injectable, Logger } from '@nestjs/common';
import { SpaceWeatherService } from '../space-weather/space-weather.service';
import { IntelligenceService } from '../intelligence/intelligence.service';
import { PushSubscription } from '../../common/entities/push-subscription.entity';
import { SubscriptionType } from '../../common/enums';

interface DigestContent {
  weatherAlerts: any[];
  intelligence: any[];
  date: string;
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    private spaceWeatherService: SpaceWeatherService,
    private intelligenceService: IntelligenceService,
  ) {}

  async generateDigestContent(
    subscription: PushSubscription,
  ): Promise<DigestContent> {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content: DigestContent = {
      weatherAlerts: [],
      intelligence: [],
      date,
    };

    // 获取空间天气预警
    if (
      subscription.subscriptionTypes.includes(SubscriptionType.SPACE_WEATHER)
    ) {
      try {
        const alerts = await this.spaceWeatherService.getAlerts(5);
        // 只保留高等级预警
        content.weatherAlerts = alerts.filter((alert: any) => alert.level >= 2);
      } catch (error) {
        this.logger.error('Failed to fetch weather alerts', error);
      }
    }

    // 获取航天情报
    if (
      subscription.subscriptionTypes.includes(SubscriptionType.INTELLIGENCE)
    ) {
      try {
        const result = await this.intelligenceService.findAll(
          { page: 1, pageSize: 5 },
          'basic',
        );
        content.intelligence = result.list.map((item: any) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          category: item.category,
          publishedAt: item.publishedAt,
        }));
      } catch (error) {
        this.logger.error('Failed to fetch intelligence', error);
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
