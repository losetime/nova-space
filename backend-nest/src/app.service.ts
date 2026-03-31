import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SatelliteTle } from './modules/satellite/entities/satellite-tle.entity';
import { SatelliteMetadataEntity } from './modules/satellite/entities/satellite-metadata.entity';
import { User } from './common/entities/user.entity';
import { Article } from './modules/education/entities/article.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(SatelliteTle)
    private readonly satelliteTleRepository: Repository<SatelliteTle>,
    @InjectRepository(SatelliteMetadataEntity)
    private readonly satelliteMetadataRepository: Repository<SatelliteMetadataEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  getHello(): string {
    return 'Nova Space API v1.0.0';
  }

  async getStats() {
    // 统计在轨卫星数量
    const satelliteCount = await this.satelliteTleRepository.count();

    // 统计国家/地区数量
    const countryCount = await this.satelliteMetadataRepository
      .createQueryBuilder('metadata')
      .where('metadata.countryCode IS NOT NULL')
      .andWhere('metadata.countryCode != :empty', { empty: '' })
      .select('COUNT(DISTINCT metadata.countryCode)', 'count')
      .getRawOne();

    // 统计知识条目数量（已发布的文章）
    const articleCount = await this.articleRepository.count({
      where: { isPublished: true },
    });

    // 统计活跃用户数量
    const userCount = await this.userRepository.count({
      where: { isActive: true },
    });

    return {
      satellites: satelliteCount,
      countries: parseInt(countryCount?.count || '0', 10),
      articles: articleCount,
      users: userCount,
    };
  }
}