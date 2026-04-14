import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import type { DrizzleClient } from '../../db';
import * as schema from '../../db/schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { CreateIntelligenceDto } from './dto/create-intelligence.dto';
import { QueryIntelligenceDto } from './dto/query-intelligence.dto';

@Injectable()
export class IntelligenceService {
  constructor(@Inject(DRIZZLE) private db: DrizzleClient) {}

  async findAll(query: QueryIntelligenceDto, userLevel?: string) {
    const { category, page = 1, pageSize = 12 } = query;
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];

    if (category) {
      conditions.push(eq(schema.intelligences.category, category as any));
    }

    if (userLevel === 'professional') {
    } else if (userLevel === 'advanced') {
      conditions.push(
        inArray(schema.intelligences.level, ['free', 'advanced'])
      );
    } else {
      conditions.push(eq(schema.intelligences.level, 'free'));
    }

    const list = await this.db
      .select()
      .from(schema.intelligences)
      .where(and(...conditions))
      .orderBy(desc(schema.intelligences.publishedAt))
      .limit(pageSize)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.intelligences)
      .where(and(...conditions));

    return {
      list: list.map((item) => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
        isLocked: userLevel === 'basic' && item.level !== 'free',
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async findOne(id: number, userId?: string) {
    const [intelligence] = await this.db
      .select()
      .from(schema.intelligences)
      .where(eq(schema.intelligences.id, id));

    if (!intelligence) {
      return null;
    }

    await this.db
      .update(schema.intelligences)
      .set({ views: intelligence.views + 1 })
      .where(eq(schema.intelligences.id, id));

    let isCollected = false;
    if (userId) {
      const [collect] = await this.db
        .select()
        .from(schema.intelligenceCollects)
        .where(
          and(
            eq(schema.intelligenceCollects.userId, userId),
            eq(schema.intelligenceCollects.intelligenceId, id)
          )
        );
      isCollected = !!collect;
    }

    return {
      ...intelligence,
      tags: intelligence.tags ? JSON.parse(intelligence.tags) : [],
      isCollected,
    };
  }

  async getHotList(limit: number = 5) {
    const list = await this.db
      .select({
        id: schema.intelligences.id,
        title: schema.intelligences.title,
        views: schema.intelligences.views,
      })
      .from(schema.intelligences)
      .orderBy(desc(schema.intelligences.views))
      .limit(limit);

    return list;
  }

  async collect(userId: string, intelligenceId: number) {
    const [existing] = await this.db
      .select()
      .from(schema.intelligenceCollects)
      .where(
        and(
          eq(schema.intelligenceCollects.userId, userId),
          eq(schema.intelligenceCollects.intelligenceId, intelligenceId)
        )
      );

    if (existing) {
      await this.db
        .delete(schema.intelligenceCollects)
        .where(eq(schema.intelligenceCollects.id, existing.id));

      const [intel] = await this.db
        .select()
        .from(schema.intelligences)
        .where(eq(schema.intelligences.id, intelligenceId));

      await this.db
        .update(schema.intelligences)
        .set({ collects: (intel?.collects || 1) - 1 })
        .where(eq(schema.intelligences.id, intelligenceId));

      return { collected: false };
    } else {
      await this.db.insert(schema.intelligenceCollects).values({
        userId,
        intelligenceId,
      });

      const [intel] = await this.db
        .select()
        .from(schema.intelligences)
        .where(eq(schema.intelligences.id, intelligenceId));

      await this.db
        .update(schema.intelligences)
        .set({ collects: (intel?.collects || 0) + 1 })
        .where(eq(schema.intelligences.id, intelligenceId));

      return { collected: true };
    }
  }

  async getUserCollects(userId: string) {
    const collects = await this.db
      .select({
        intelligenceId: schema.intelligenceCollects.intelligenceId,
        createdAt: schema.intelligenceCollects.createdAt,
        title: schema.intelligences.title,
        summary: schema.intelligences.summary,
        content: schema.intelligences.content,
        cover: schema.intelligences.cover,
        category: schema.intelligences.category,
        level: schema.intelligences.level,
        tags: schema.intelligences.tags,
      })
      .from(schema.intelligenceCollects)
      .leftJoin(schema.intelligences, eq(schema.intelligenceCollects.intelligenceId, schema.intelligences.id))
      .where(eq(schema.intelligenceCollects.userId, userId))
      .orderBy(desc(schema.intelligenceCollects.createdAt));

    return collects.map((c) => ({
      title: c.title,
      summary: c.summary,
      content: c.content,
      cover: c.cover,
      category: c.category,
      level: c.level,
      tags: c.tags ? JSON.parse(c.tags) : [],
      collectedAt: c.createdAt,
    }));
  }

  async create(dto: CreateIntelligenceDto) {
    const [intelligence] = await this.db
      .insert(schema.intelligences)
      .values(dto)
      .returning();
    return intelligence;
  }
}