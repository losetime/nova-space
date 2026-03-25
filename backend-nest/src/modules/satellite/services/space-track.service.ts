import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SatelliteTle } from '../entities/satellite-tle.entity';
import { SatelliteMetadataEntity } from '../entities/satellite-metadata.entity';
import type { TLEData, SatelliteMetadata } from '../interfaces/satellite.interface';

/**
 * 卫星分类配置 (CelesTrak)
 */
const SATELLITE_GROUPS: Record<string, string> = {
  active: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
  starlink: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
  stations: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
  gps: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle',
  beidou: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=tle',
  glonass: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=glo-ops&FORMAT=tle',
  galileo: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=tle',
  weather: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
  science: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle',
};

/**
 * 卫星数据服务
 * 从 CelesTrak 获取卫星 TLE 和元数据
 * 数据存储在 PostgreSQL 数据库中
 */
@Injectable()
export class SpaceTrackService implements OnModuleInit {
  private readonly logger = new Logger(SpaceTrackService.name);
  private cachedTLEs: TLEData[] = [];
  private maxSatellites: number;
  private dataGroup: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SatelliteTle)
    private readonly tleRepository: Repository<SatelliteTle>,
    @InjectRepository(SatelliteMetadataEntity)
    private readonly metadataRepository: Repository<SatelliteMetadataEntity>,
  ) {
    this.maxSatellites = this.configService.get<number>('satellite.maxSatellites', 10000);
    this.dataGroup = this.configService.get<string>('satellite.dataGroup', 'active');
  }

  async onModuleInit() {
    // 检查数据库是否有数据
    const tleCount = await this.tleRepository.count();
    const metadataCount = await this.metadataRepository.count();

    if (tleCount > 0 && metadataCount > 0) {
      this.logger.log(`从数据库加载卫星数据: ${tleCount} TLE, ${metadataCount} 元数据`);
      await this.loadFromDatabase();
    } else {
      // 首次启动，从网络获取数据
      this.logger.log('数据库为空，从 CelesTrak 获取数据...');
      await this.refreshAllData();
    }
  }

  /**
   * 从数据库加载数据到内存
   */
  private async loadFromDatabase(): Promise<void> {
    // 加载 TLE 数据
    const tleEntities = await this.tleRepository.find({
      order: { updatedAt: 'DESC' },
      take: this.maxSatellites,
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

    this.logger.log(`已加载 ${this.cachedTLEs.length} 条 TLE 数据到内存`);
  }

  /**
   * 刷新所有数据（TLE + 元数据）
   * 每日凌晨 3 点自动执行
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async refreshAllData(): Promise<void> {
    this.logger.log('开始刷新卫星数据...');

    try {
      // 并行刷新 TLE 和元数据
      await Promise.all([this.refreshTLEData(), this.refreshMetadata()]);

      // 合并 TLE 轨道参数到元数据
      await this.mergeTLEParamsToMetadata();

      this.logger.log('卫星数据刷新完成');
    } catch (error) {
      this.logger.error(`刷新卫星数据失败: ${error.message}`);
    }
  }

  /**
   * 刷新 TLE 数据
   */
  private async refreshTLEData(): Promise<void> {
    this.logger.log('正在刷新 TLE 数据...');

    const tleData = await this.fetchTLEFromCelesTrak();

    // 清空现有数据
    await this.tleRepository.clear();

    // 批量插入新数据
    const entities = tleData.slice(0, this.maxSatellites).map((tle) => {
      const entity = new SatelliteTle();
      entity.noradId = tle.noradId;
      entity.name = tle.name;
      entity.line1 = tle.line1;
      entity.line2 = tle.line2;
      if (tle.epoch) entity.epoch = new Date(tle.epoch);
      if (tle.inclination !== undefined) entity.inclination = tle.inclination;
      if (tle.raan !== undefined) entity.raan = tle.raan;
      if (tle.eccentricity !== undefined) entity.eccentricity = tle.eccentricity;
      if (tle.argOfPerigee !== undefined) entity.argOfPerigee = tle.argOfPerigee;
      if (tle.meanMotion !== undefined) entity.meanMotion = tle.meanMotion;
      return entity;
    });

    await this.tleRepository.save(entities);
    this.cachedTLEs = tleData.slice(0, this.maxSatellites);

    this.logger.log(`已刷新 ${this.cachedTLEs.length} 条 TLE 数据`);
  }

  /**
   * 刷新元数据
   */
  private async refreshMetadata(): Promise<void> {
    this.logger.log('正在刷新元数据...');

    const metadata = await this.fetchMetadataFromCelesTrak();

    // 批量 upsert（保留已有的 ESA DISCOS 扩展数据）
    for (const item of metadata) {
      if (!item.noradId) continue;

      const existing = await this.metadataRepository.findOne({
        where: { noradId: item.noradId },
      });

      if (existing) {
        // 只更新基础字段，保留 ESA DISCOS 扩展数据
        await this.metadataRepository.update(item.noradId!, {
          name: item.name,
          objectId: item.objectId,
          altNames: item.altNames,
          objectType: item.objectType,
          status: item.status,
          countryCode: item.countryCode,
          launchDate: item.launchDate,
          launchSite: item.launchSite,
          decayDate: item.decayDate,
          period: item.period,
          inclination: item.inclination,
          apogee: item.apogee,
          perigee: item.perigee,
          rcs: item.rcs,
          stdMag: item.stdMag,
        });
      } else {
        // 新增记录
        const entity = new SatelliteMetadataEntity();
        Object.assign(entity, item);
        await this.metadataRepository.save(entity);
      }
    }

    this.logger.log(`已刷新 ${metadata.length} 条元数据`);
  }

  /**
   * 合并 TLE 轨道参数到元数据
   */
  private async mergeTLEParamsToMetadata(): Promise<void> {
    const now = new Date();
    let mergedCount = 0;

    for (const tle of this.cachedTLEs) {
      if (!tle.epoch) continue;

      const epochDate = new Date(tle.epoch);
      const ageMs = now.getTime() - epochDate.getTime();
      const tleAge = Math.floor(ageMs / (1000 * 60 * 60 * 24));

      await this.metadataRepository.update(tle.noradId, {
        eccentricity: tle.eccentricity,
        raan: tle.raan,
        argOfPerigee: tle.argOfPerigee,
        tleEpoch: epochDate,
        tleAge,
      });

      mergedCount++;
    }

    this.logger.log(`合并了 ${mergedCount} 条 TLE 轨道参数到元数据`);
  }

  /**
   * 从 CelesTrak 获取 TLE 数据
   */
  private async fetchTLEFromCelesTrak(): Promise<TLEData[]> {
    const https = await import('https');
    const url = SATELLITE_GROUPS[this.dataGroup] || SATELLITE_GROUPS.active;

    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const tles = this.parseTLEData(data);
              resolve(tles);
            } catch (error) {
              reject(error);
            }
          });
        })
        .on('error', reject);
    });
  }

  /**
   * 从 CelesTrak 获取元数据
   */
  private async fetchMetadataFromCelesTrak(): Promise<Partial<SatelliteMetadataEntity>[]> {
    const https = await import('https');
    // CelesTrak SATCAT API - 获取完整卫星目录 (JSON 格式)
    const url = 'https://celestrak.org/satcat/csv.php';

    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              // 检查是否是有效响应
              if (data.startsWith('<') || data.startsWith('Invalid')) {
                this.logger.error(`CelesTrak API 返回错误: ${data.substring(0, 100)}`);
                reject(new Error(`CelesTrak API 错误: ${data.substring(0, 50)}`));
                return;
              }

              // 解析 CSV 格式
              const lines = data.trim().split('\n');
              if (lines.length < 2) {
                reject(new Error('CelesTrak 返回数据为空'));
                return;
              }

              // 第一行是表头
              const headers = lines[0].split(',');
              const metadata: Partial<SatelliteMetadataEntity>[] = [];

              for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length < headers.length) continue;

                const item: Record<string, string> = {};
                headers.forEach((header, idx) => {
                  item[header.trim()] = values[idx]?.trim() || '';
                });

                metadata.push({
                  noradId: this.formatNoradId(item.NORAD_CAT_ID || item.norad_cat_id || ''),
                  name: item.OBJECT_NAME || item.object_name || '',
                  objectId: item.OBJECT_ID || item.object_id || '',
                  altNames: item.ALT_NAMES ? item.ALT_NAMES.split(',') : undefined,
                  objectType: item.OBJECT_TYPE || item.object_type || '',
                  status: item.STATUS || item.status || '',
                  countryCode: item.OWNER || item.owner || '',
                  launchDate: item.LAUNCH_DATE || item.launch || '',
                  launchSite: item.LAUNCH_SITE || item.site || '',
                  decayDate: item.DECAY_DATE || item.decay || undefined,
                  period: item.PERIOD ? parseFloat(item.PERIOD) : item.period ? parseFloat(item.period) : undefined,
                  inclination: item.INCLINATION ? parseFloat(item.INCLINATION) : item.inclination ? parseFloat(item.inclination) : undefined,
                  apogee: item.APOGEE ? parseFloat(item.APOGEE) : item.apogee ? parseFloat(item.apogee) : undefined,
                  perigee: item.PERIGEE ? parseFloat(item.PERIGEE) : item.perigee ? parseFloat(item.perigee) : undefined,
                  rcs: item.RCS || item.rcs_size || '',
                  stdMag: item.STD_MAG ? parseFloat(item.STD_MAG) : undefined,
                  hasDiscosData: false,
                });
              }

              this.logger.log(`从 CelesTrak 解析了 ${metadata.length} 条元数据`);
              resolve(metadata);
            } catch (error) {
              this.logger.error(`解析 CelesTrak 数据失败: ${error.message}`);
              reject(error);
            }
          });
        })
        .on('error', (error) => {
          this.logger.error(`CelesTrak 网络请求失败: ${error.message}`);
          reject(error);
        });
    });
  }

  /**
   * 解析 CSV 行（处理引号内的逗号）
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * 格式化 NORAD ID 为 5 位字符串
   */
  private formatNoradId(id: string | number): string {
    return String(id).padStart(5, '0');
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
      tleAge: entity.tleAge,
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
      purpose: entity.purpose,
      contractor: entity.contractor,
      lifetime: entity.lifetime,
      platform: entity.platform,
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
   * 解析 TLE 数据
   */
  private parseTLEData(tleData: string): TLEData[] {
    const lines = tleData.split('\n').filter((line) => line.trim() !== '');
    const tles: TLEData[] = [];

    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        const name = lines[i].trim();
        const line1 = lines[i + 1].trim();
        const line2 = lines[i + 2].trim();

        const noradIdMatch = line1.match(/^1 (\d{5})/);
        const noradId = noradIdMatch ? this.formatNoradId(noradIdMatch[1]) : null;

        if (noradId) {
          const orbitalParams = this.parseOrbitalParams(line1, line2);

          tles.push({
            name,
            noradId,
            line1,
            line2,
            ...orbitalParams,
          });
        }
      }
    }

    return tles;
  }

  /**
   * 从 TLE 行解析轨道参数
   */
  private parseOrbitalParams(line1: string, line2: string): Partial<TLEData> {
    const params: Partial<TLEData> = {};

    try {
      const epochStr = line1.substring(18, 32).trim();
      if (epochStr) {
        params.epoch = this.parseTLEEpoch(epochStr);
      }

      const inclination = parseFloat(line2.substring(8, 16).trim());
      if (!isNaN(inclination)) {
        params.inclination = inclination;
      }

      const raan = parseFloat(line2.substring(17, 25).trim());
      if (!isNaN(raan)) {
        params.raan = raan;
      }

      const eccentricityStr = line2.substring(26, 33).trim();
      if (eccentricityStr) {
        params.eccentricity = parseFloat('0.' + eccentricityStr);
      }

      const argOfPerigee = parseFloat(line2.substring(34, 42).trim());
      if (!isNaN(argOfPerigee)) {
        params.argOfPerigee = argOfPerigee;
      }

      const meanMotion = parseFloat(line2.substring(52, 63).trim());
      if (!isNaN(meanMotion)) {
        params.meanMotion = meanMotion;
      }
    } catch (error) {
      this.logger.warn(`解析轨道参数失败: ${error.message}`);
    }

    return params;
  }

  /**
   * 解析 TLE 历元时间
   */
  private parseTLEEpoch(epochStr: string): string {
    try {
      const year = parseInt(epochStr.substring(0, 2));
      const dayOfYear = parseFloat(epochStr.substring(2));

      const fullYear = year >= 57 ? 1900 + year : 2000 + year;

      const date = new Date(fullYear, 0, 1);
      date.setDate(date.getDate() + Math.floor(dayOfYear) - 1);

      const fractionalDay = dayOfYear - Math.floor(dayOfYear);
      const hours = fractionalDay * 24;
      date.setHours(
        Math.floor(hours),
        Math.floor((hours % 1) * 60),
        Math.floor(((hours * 60) % 1) * 60),
      );

      return date.toISOString();
    } catch {
      return epochStr;
    }
  }
}