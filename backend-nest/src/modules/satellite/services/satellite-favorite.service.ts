import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../../db/drizzle.module';
import type { DrizzleClient } from '../../../db';
import * as schema from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class SatelliteFavoriteService {
  constructor(@Inject(DRIZZLE) private db: DrizzleClient) {}

  async toggleFavorite(
    userId: string,
    noradId: string,
  ): Promise<{ favorited: boolean }> {
    const [existing] = await this.db
      .select()
      .from(schema.userFavorites)
      .where(
        and(
          eq(schema.userFavorites.userId, userId),
          eq(schema.userFavorites.targetId, noradId),
          eq(schema.userFavorites.type, 'satellite')
        )
      );

    if (existing) {
      await this.db
        .delete(schema.userFavorites)
        .where(eq(schema.userFavorites.id, existing.id));
      return { favorited: false };
    }

    await this.db.insert(schema.userFavorites).values({
      userId,
      targetId: noradId,
      type: 'satellite',
    });
    return { favorited: true };
  }

  async isFavorited(userId: string, noradId: string): Promise<boolean> {
    const [favorite] = await this.db
      .select()
      .from(schema.userFavorites)
      .where(
        and(
          eq(schema.userFavorites.userId, userId),
          eq(schema.userFavorites.targetId, noradId),
          eq(schema.userFavorites.type, 'satellite')
        )
      );
    return !!favorite;
  }

  async getUserFavorites(userId: string): Promise<schema.UserFavorite[]> {
    return this.db
      .select()
      .from(schema.userFavorites)
      .where(
        and(
          eq(schema.userFavorites.userId, userId),
          eq(schema.userFavorites.type, 'satellite')
        )
      )
      .orderBy(desc(schema.userFavorites.createdAt));
  }

  async removeFavorite(userId: string, noradId: string): Promise<void> {
    const [favorite] = await this.db
      .select()
      .from(schema.userFavorites)
      .where(
        and(
          eq(schema.userFavorites.userId, userId),
          eq(schema.userFavorites.targetId, noradId),
          eq(schema.userFavorites.type, 'satellite')
        )
      );

    if (!favorite) {
      throw new NotFoundException('卫星关注记录不存在');
    }

    await this.db
      .delete(schema.userFavorites)
      .where(eq(schema.userFavorites.id, favorite.id));
  }
}