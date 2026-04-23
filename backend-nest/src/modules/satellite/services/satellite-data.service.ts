import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../../db/drizzle.module';
import type { DrizzleClient } from '../../../db';
import * as schema from '../../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { Cron, CronExpression } from '@nestjs/schedule';
import type {
  TLEData,
  SatelliteMetadata,
} from '../interfaces/satellite.interface';

@Injectable()
export class SatelliteDataService implements OnModuleInit {
  private readonly logger = new Logger(SatelliteDataService.name);
  private cachedTLEs: TLEData[] = [];
  private cachedMetadata: Map<
    string,
    { countryCode?: string; mission?: string; operator?: string }
  > = new Map();

  constructor(@Inject(DRIZZLE) private db: DrizzleClient) {}

  async onModuleInit() {
    await this.refreshFromDatabase();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async refreshFromDatabase(): Promise<void> {
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.satelliteTle);
    if (Number(count) > 0) {
      this.logger.log(`从数据库刷新卫星数据: ${count} TLE`);
      await this.loadFromDatabase();
    } else {
      this.logger.warn('数据库中没有卫星数据');
    }
  }

  private async loadFromDatabase(): Promise<void> {
    const metadataEntities = await this.db
      .select()
      .from(schema.satelliteMetadata);

    const completenessScores = new Map<string, number>();
    metadataEntities.forEach((entity: any) => {
      const score = Object.values(entity).filter(
        (v) => v !== null && v !== undefined,
      ).length;
      completenessScores.set(entity.noradId, score);
    });

    const tleEntities = await this.db
      .select()
      .from(schema.satelliteTle);

    tleEntities.sort((a, b) => {
      const scoreA = completenessScores.get(a.noradId) ?? 0;
      const scoreB = completenessScores.get(b.noradId) ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const timeA = a.updatedAt?.getTime() ?? 0;
      const timeB = b.updatedAt?.getTime() ?? 0;
      return timeB - timeA;
    });

    this.cachedTLEs = tleEntities.map((entity: any) => ({
      name: entity.name,
      noradId: entity.noradId,
      line1: entity.line1,
      line2: entity.line2,
      epoch: entity.epoch?.toISOString(),
      inclination: entity.inclination ?? undefined,
      raan: entity.raan ?? undefined,
      eccentricity: entity.eccentricity ?? undefined,
      argOfPerigee: entity.argOfPerigee ?? undefined,
      meanMotion: entity.meanMotion ?? undefined,
    }));

    this.cachedMetadata.clear();
    metadataEntities.forEach((entity: any) => {
      this.cachedMetadata.set(entity.noradId, {
        countryCode: entity.countryCode || undefined,
        mission: entity.mission || undefined,
        operator: entity.operator || undefined,
      });
    });
    this.logger.log(`已加载 ${this.cachedTLEs.length} 条 TLE 数据`);
  }

  getCachedMetadata() {
    return this.cachedMetadata;
  }
  getCachedTLEs(): TLEData[] {
    return this.cachedTLEs;
  }

  getAllTLEsForClient() {
    return this.cachedTLEs.map((tle) => ({
      noradId: tle.noradId,
      name: tle.name,
      line1: tle.line1,
      line2: tle.line2,
      countryCode: this.cachedMetadata.get(tle.noradId)?.countryCode,
      mission: this.cachedMetadata.get(tle.noradId)?.mission,
      operator: this.cachedMetadata.get(tle.noradId)?.operator,
    }));
  }

  async getSatelliteMetadata(
    noradId: string,
  ): Promise<SatelliteMetadata | null> {
    const [entity] = await this.db
      .select()
      .from(schema.satelliteMetadata)
      .where(eq(schema.satelliteMetadata.noradId, noradId));
    if (!entity) return null;
    return this.entityToMetadata(entity as any);
  }

  async getAllMetadata(): Promise<Map<string, SatelliteMetadata>> {
    const entities = await this.db.select().from(schema.satelliteMetadata);
    const map = new Map<string, SatelliteMetadata>();
    entities.forEach((entity: any) =>
      map.set(entity.noradId, this.entityToMetadata(entity)),
    );
    return map;
  }

  private entityToMetadata(entity: any): SatelliteMetadata {
    let tleAge: number | undefined;
    if (entity.tleEpoch) {
      const ageMs = Date.now() - entity.tleEpoch.getTime();
      tleAge = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }
    return {
      noradId: entity.noradId,
      name: entity.name ?? undefined,
      objectId: entity.objectId ?? undefined,
      altName: entity.altName ?? undefined,
      objectType: entity.objectType ?? undefined,
      status: entity.status ?? undefined,
      countryCode: entity.countryCode ?? undefined,
      launchDate: entity.launchDate ?? undefined,
      launchSite: entity.launchSite ?? undefined,
      launchVehicle: entity.launchVehicle ?? undefined,
      decayDate: entity.decayDate ?? undefined,
      period: entity.period ?? undefined,
      inclination: entity.inclination ?? undefined,
      apogee: entity.apogee ?? undefined,
      perigee: entity.perigee ?? undefined,
      eccentricity: entity.eccentricity ?? undefined,
      raan: entity.raan ?? undefined,
      argOfPerigee: entity.argOfPerigee ?? undefined,
      rcs: entity.rcs ?? undefined,
      stdMag: entity.stdMag ?? undefined,
      tleEpoch: entity.tleEpoch?.toISOString(),
      tleAge,
      cosparId: entity.cosparId ?? undefined,
      objectClass: entity.objectClass ?? undefined,
      launchMass: entity.launchMass ?? undefined,
      shape: entity.shape ?? undefined,
      dimensions: entity.dimensions ?? undefined,
      span: entity.span ?? undefined,
      mission: entity.mission ?? undefined,
      firstEpoch: entity.firstEpoch ?? undefined,
      operator: entity.operator ?? undefined,
      manufacturer: entity.manufacturer ?? undefined,
      contractor: entity.contractor ?? undefined,
      bus: entity.bus ?? undefined,
      configuration: entity.configuration ?? undefined,
      purpose: entity.purpose ?? undefined,
      power: entity.power ?? undefined,
      motor: entity.motor ?? undefined,
      length: entity.length ?? undefined,
      diameter: entity.diameter ?? undefined,
      dryMass: entity.dryMass ?? undefined,
      equipment: entity.equipment ?? undefined,
      adcs: entity.adcs ?? undefined,
      payload: entity.payload ?? undefined,
      constellationName: entity.constellationName ?? undefined,
      lifetime: entity.lifetime ?? undefined,
      predDecayDate: entity.predDecayDate ?? undefined,
      flightNo: entity.flightNo ?? undefined,
      cosparLaunchNo: entity.cosparLaunchNo ?? undefined,
      launchFailure: entity.launchFailure ?? undefined,
      launchSiteName: entity.launchSiteName ?? undefined,
      summary: entity.summary ?? undefined,
      stable_date: entity.stableDate ?? undefined,
      launch_pad: entity.launchPad ?? undefined,
      material_composition: entity.materialComposition ?? undefined,
      major_events: entity.majorEvents ?? undefined,
      related_satellites: entity.relatedSatellites ?? undefined,
      transmitter_frequencies: entity.transmitterFrequencies ?? undefined,
    };
  }

  async updateSatelliteMetadata(noradId: string, data: any): Promise<void> {
    await this.db
      .update(schema.satelliteMetadata)
      .set(data)
      .where(eq(schema.satelliteMetadata.noradId, noradId));
  }

  async getMissionCounts(): Promise<{ name: string; count: number }[]> {
    const tleNoradIds = new Set(this.cachedTLEs.map((tle) => tle.noradId));
    const metadata = await this.getAllMetadata();
    const missionCount = new Map<string, number>();
    metadata.forEach((meta, noradId) => {
      if (tleNoradIds.has(noradId) && meta.mission) {
        const category = this.categorizeMission(meta.mission);
        missionCount.set(category, (missionCount.get(category) || 0) + 1);
      }
    });
    return Array.from(missionCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getOperatorCounts(): Promise<{ name: string; count: number }[]> {
    const tleNoradIds = new Set(this.cachedTLEs.map((tle) => tle.noradId));
    const metadata = await this.getAllMetadata();
    const operatorCount = new Map<string, number>();
    metadata.forEach((meta, noradId) => {
      if (tleNoradIds.has(noradId) && meta.operator) {
        operatorCount.set(
          meta.operator,
          (operatorCount.get(meta.operator) || 0) + 1,
        );
      }
    });
    return Array.from(operatorCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  private readonly MISSION_CATEGORIES: Record<string, string> = {
    Communications: '通信',
    Navigation: '导航',
    'Earth Observation': '遥感',
    Weather: '气象',
    'Space Science': '科学',
    Technology: '技术试验',
    Defense: '国防',
    'Space Station': '载人航天',
  };

  private categorizeMission(mission: string): string {
    return this.MISSION_CATEGORIES[mission] || '其他';
  }
}
