import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SatelliteTle } from '../entities/satellite-tle.entity';
import { SatelliteMetadataEntity } from '../entities/satellite-metadata.entity';
import type { TLEData, SatelliteMetadata } from '../interfaces/satellite.interface';

/**
 * 卫星数据服务
 * 从数据库加载卫星 TLE 和元数据
 */
@Injectable()
export class SatelliteDataService implements OnModuleInit {
  private readonly logger = new Logger(SatelliteDataService.name);
  private cachedTLEs: TLEData[] = [];
  private cachedMetadata: Map<string, { countryCode?: string; mission?: string; operator?: string }> = new Map();

  constructor(
    @InjectRepository(SatelliteTle)
    private readonly tleRepository: Repository<SatelliteTle>,
    @InjectRepository(SatelliteMetadataEntity)
    private readonly metadataRepository: Repository<SatelliteMetadataEntity>,
  ) {}

  async onModuleInit() {
    await this.refreshFromDatabase();
  }

  /**
   * 从数据库刷新数据到内存
   * 启动时执行，每小时自动刷新
   */
  @Cron(CronExpression.EVERY_HOUR)
  async refreshFromDatabase(): Promise<void> {
    const tleCount = await this.tleRepository.count();

    if (tleCount > 0) {
      const metadataCount = await this.metadataRepository.count();
      this.logger.log(`从数据库刷新卫星数据: ${tleCount} TLE, ${metadataCount} 元数据`);
      await this.loadFromDatabase();
    } else {
      this.logger.warn('数据库中没有卫星数据，请通过管理接口导入数据');
    }
  }

  /**
   * 从数据库加载数据到内存
   */
  private async loadFromDatabase(): Promise<void> {
    const tleEntities = await this.tleRepository.find({
      order: { updatedAt: 'DESC' },
    });

    this.cachedTLEs = tleEntities.map((entity) => ({
      name: entity.name,
      noradId: entity.noradId,
      line1: entity.line1,
      line2: entity.line2,
      epoch: entity.epoch?.toISOString(),
      inclination: entity.inclination,
      raan: entity.raan,
      eccentricity: entity.eccentricity,
      argOfPerigee: entity.argOfPerigee,
      meanMotion: entity.meanMotion,
    }));

    // 加载元数据缓存（筛选字段）
    const metadataEntities = await this.metadataRepository.find();
    this.cachedMetadata.clear();
    metadataEntities.forEach((entity) => {
      this.cachedMetadata.set(entity.noradId, {
        countryCode: entity.countryCode || undefined,
        mission: entity.mission || undefined,
        operator: entity.operator || undefined,
      });
    });

    this.logger.log(`已加载 ${this.cachedTLEs.length} 条 TLE 数据和 ${this.cachedMetadata.size} 条元数据到内存`);
  }

  /**
   * 获取缓存的元数据（筛选字段）
   */
  getCachedMetadata(): Map<string, { countryCode?: string; mission?: string; operator?: string }> {
    return this.cachedMetadata;
  }

  /**
   * 获取缓存的 TLE 数据
   */
  getCachedTLEs(): TLEData[] {
    return this.cachedTLEs;
  }

  /**
   * 获取卫星元数据（从数据库）
   */
  async getSatelliteMetadata(noradId: string): Promise<SatelliteMetadata | null> {
    const entity = await this.metadataRepository.findOne({
      where: { noradId },
    });

    if (!entity) return null;

    return this.entityToMetadata(entity);
  }

  /**
   * 获取所有卫星元数据（从数据库）
   */
  async getAllMetadata(): Promise<Map<string, SatelliteMetadata>> {
    const entities = await this.metadataRepository.find();
    const map = new Map<string, SatelliteMetadata>();

    entities.forEach((entity) => {
      map.set(entity.noradId, this.entityToMetadata(entity));
    });

    return map;
  }

  /**
   * 实体转接口
   */
  private entityToMetadata(entity: SatelliteMetadataEntity): SatelliteMetadata {
    // 动态计算 TLE 数据年龄
    let tleAge: number | undefined;
    if (entity.tleEpoch) {
      const ageMs = Date.now() - entity.tleEpoch.getTime();
      tleAge = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }

    return {
      noradId: entity.noradId,
      name: entity.name,
      objectId: entity.objectId,
      altNames: entity.altNames,
      objectType: entity.objectType,
      status: entity.status,
      countryCode: entity.countryCode,
      launchDate: entity.launchDate,
      launchSite: entity.launchSite,
      launchVehicle: entity.launchVehicle,
      decayDate: entity.decayDate,
      period: entity.period,
      inclination: entity.inclination,
      apogee: entity.apogee,
      perigee: entity.perigee,
      eccentricity: entity.eccentricity,
      raan: entity.raan,
      argOfPerigee: entity.argOfPerigee,
      rcs: entity.rcs,
      stdMag: entity.stdMag,
      tleEpoch: entity.tleEpoch?.toISOString(),
      tleAge,
      // ESA DISCOS 扩展字段
      cosparId: entity.cosparId,
      objectClass: entity.objectClass,
      launchMass: entity.launchMass,
      shape: entity.shape,
      dimensions: entity.dimensions,
      span: entity.span,
      mission: entity.mission,
      firstEpoch: entity.firstEpoch,
      operator: entity.operator,
      contractor: entity.contractor,
      lifetime: entity.lifetime,
      platform: entity.platform,
      predDecayDate: entity.predDecayDate,
      // 发射扩展信息
      flightNo: entity.flightNo,
      cosparLaunchNo: entity.cosparLaunchNo,
      launchFailure: entity.launchFailure,
      launchSiteName: entity.launchSiteName,
    };
  }

  /**
   * 更新卫星元数据（用于 ESA DISCOS 扩展）
   */
  async updateSatelliteMetadata(
    noradId: string,
    data: Partial<SatelliteMetadataEntity>,
  ): Promise<void> {
    await this.metadataRepository.update(noradId, data);
  }

  /**
   * 用途分类映射（ESA DISCOS mission -> 简化分类）
   */
  private readonly PURPOSE_CATEGORIES: Record<string, string> = {
    // ===== 通信类 =====
    'Civil Communications': '通信',
    'Defense Communications': '通信',
    'Commercial Communications': '通信',
    'Communications': '通信',
    'Telecommunications': '通信',
    'Broadcasting': '通信',
    'Mobile Communications': '通信',
    'Fixed Satellite Services': '通信',

    // ===== 导航类 =====
    'Civil Navigation': '导航',
    'Defense Navigation': '导航',
    'Commercial Navigation': '导航',
    'Navigation': '导航',
    'Positioning': '导航',
    'GNSS': '导航',
    'GPS': '导航',
    'GLONASS': '导航',
    'Galileo': '导航',
    'BeiDou': '导航',

    // ===== 遥感/对地观测类 =====
    'Civil Imaging': '遥感',
    'Civil Earth Observation': '遥感',
    'Civil Remote Sensing': '遥感',
    'Defense Imaging': '遥感',
    'Defense Earth Observation': '遥感',
    'Defense Reconnaissance': '遥感',
    'Commercial Imaging': '遥感',
    'Commercial Remote Sensing': '遥感',
    'Earth Observation': '遥感',
    'Remote Sensing': '遥感',
    'Imaging': '遥感',
    'Reconnaissance': '遥感',
    'Surveillance': '遥感',
    'Mapping': '遥感',
    'Cartography': '遥感',
    'Terrain Mapping': '遥感',
    'Oceanography': '遥感',
    'Marine Observation': '遥感',
    'Land Observation': '遥感',

    // ===== 气象类 =====
    'Civil Weather': '气象',
    'Defense Weather': '气象',
    'Commercial Weather': '气象',
    'Weather': '气象',
    'Meteorological': '气象',
    'Meteorology': '气象',
    'Climate': '气象',
    'Climate Research': '气象',
    'Environmental Monitoring': '气象',

    // ===== 科学研究类 =====
    'Civil Science': '科学',
    'Civil Technology': '科学',
    'Defense Science': '科学',
    'Scientific Research': '科学',
    'Space Science': '科学',
    'Earth Science': '科学',
    'Astronomy': '科学',
    'Astrophysics': '科学',
    'Geodetic': '科学',
    'Geodesy': '科学',
    'Geophysical': '科学',
    'Geophysics': '科学',
    'Biological': '科学',
    'Biology': '科学',
    'Materials': '科学',
    'Materials Science': '科学',
    'Physics': '科学',
    'Solar Physics': '科学',
    'Space Physics': '科学',
    'Plasma Physics': '科学',
    'Cosmic Ray': '科学',
    'Particle Physics': '科学',

    // ===== 技术试验类 =====
    'Technology Demonstration': '技术试验',
    'Civil Experimental': '技术试验',
    'Defense Technology': '技术试验',
    'Experimental': '技术试验',
    'Test': '技术试验',
    'Technology Development': '技术试验',
    'Technology': '技术试验',
    'Demonstration': '技术试验',
    'Prototype': '技术试验',
    'Engineering': '技术试验',

    // ===== 国防军事类 =====
    'Defense Sigint': '国防',
    'Defense Early Warning': '国防',
    'Defense': '国防',
    'Military': '国防',
    'Missile Warning': '国防',
    'Nuclear Detection': '国防',
    'Electronic Intelligence': '国防',
    'Signals Intelligence': '国防',
    'ELINT': '国防',
    'SIGINT': '国防',

    // ===== 载人航天类 =====
    'Space Station': '载人航天',
    'Manned': '载人航天',
    'Crewed': '载人航天',
    'Cargo': '载人航天',
    'Supply': '载人航天',
    'Human Spaceflight': '载人航天',
    'Space Tourism': '载人航天',

    // ===== 数据中继类 =====
    'Data Relay': '数据中继',
    'Tracking and Data Relay': '数据中继',
    'TDRS': '数据中继',
    'Satellite Inter-satellite Link': '数据中继',

    // ===== 其他 =====
    'Civil Education': '教育',
    'Education': '教育',
    'Academic': '教育',
    'Amateur': '业余无线电',
    'Amateur Radio': '业余无线电',
    'Rescue': '搜救',
    'Search and Rescue': '搜救',
    'SAR': '搜救',
    'Training': '训练',
    ' Calibration': '校准',
    'Tracking': '跟踪',
    'Space Debris': '碎片',
    'Debris': '碎片',
  };

  /**
   * 归类用途名称
   */
  private categorizePurpose(purpose: string): string {
    return this.PURPOSE_CATEGORIES[purpose] || '其他';
  }

  /**
   * 获取用途统计（仅统计 TLE 中存在的卫星）
   * 使用 mission 字段作为用途分类（来自 ESA DISCOS）
   */
  async getPurposeCounts(): Promise<{ name: string; count: number }[]> {
    const tleData = this.getCachedTLEs();
    const tleNoradIds = new Set(tleData.map((tle) => tle.noradId));
    const metadata = await this.getAllMetadata();

    const purposeCount = new Map<string, number>();

    metadata.forEach((meta, noradId) => {
      if (tleNoradIds.has(noradId) && meta.mission) {
        const category = this.categorizePurpose(meta.mission);
        const count = purposeCount.get(category) || 0;
        purposeCount.set(category, count + 1);
      }
    });

    return Array.from(purposeCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 获取运营商统计（仅统计 TLE 中存在的卫星）
   */
  async getOperatorCounts(): Promise<{ name: string; count: number }[]> {
    const tleData = this.getCachedTLEs();
    const tleNoradIds = new Set(tleData.map((tle) => tle.noradId));
    const metadata = await this.getAllMetadata();

    const operatorCount = new Map<string, number>();

    metadata.forEach((meta, noradId) => {
      if (tleNoradIds.has(noradId) && meta.operator) {
        const count = operatorCount.get(meta.operator) || 0;
        operatorCount.set(meta.operator, count + 1);
      }
    });

    return Array.from(operatorCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
}