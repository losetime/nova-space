import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavorite } from '../../../common/entities/user-favorite.entity';
import { FavoriteType } from '../../../common/enums/user.enum';

@Injectable()
export class SatelliteFavoriteService {
  constructor(
    @InjectRepository(UserFavorite)
    private favoriteRepository: Repository<UserFavorite>,
  ) {}

  async toggleFavorite(userId: string, noradId: string): Promise<{ favorited: boolean }> {
    const existing = await this.favoriteRepository.findOne({
      where: {
        userId,
        targetId: noradId,
        type: FavoriteType.SATELLITE,
      },
    });

    if (existing) {
      await this.favoriteRepository.remove(existing);
      return { favorited: false };
    }

    const favorite = this.favoriteRepository.create({
      userId,
      targetId: noradId,
      type: FavoriteType.SATELLITE,
    });
    await this.favoriteRepository.save(favorite);
    return { favorited: true };
  }

  async isFavorited(userId: string, noradId: string): Promise<boolean> {
    const count = await this.favoriteRepository.count({
      where: {
        userId,
        targetId: noradId,
        type: FavoriteType.SATELLITE,
      },
    });
    return count > 0;
  }

  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    return this.favoriteRepository.find({
      where: {
        userId,
        type: FavoriteType.SATELLITE,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async removeFavorite(userId: string, noradId: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        userId,
        targetId: noradId,
        type: FavoriteType.SATELLITE,
      },
    });

    if (!favorite) {
      throw new NotFoundException('卫星关注记录不存在');
    }

    await this.favoriteRepository.remove(favorite);
  }
}