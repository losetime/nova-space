import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SatelliteTle } from '../entities/satellite-tle.entity';
import { SatelliteMetadataEntity } from '../entities/satellite-metadata.entity';
import type { TLEData, SatelliteMetadata } from '../interfaces/satellite.interface';

/**
 * Space-Track API 配置
 */
interface SpaceTrackConfig {
  username: string;
  password: string;
  baseUrl: string;
}

/**
 * Space-Track GP 数据响应结构
 */
interface SpaceTrackGpResponse {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  NORAD_CAT_ID: string;
  EPOCH: string;
  TLE_LINE0: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
  COUNTRY_CODE?: string;
  LAUNCH_DATE?: string;
  SITE?: string;
  OBJECT_TYPE?: string;
  RCS_SIZE?: string;
  DECAY_DATE?: string | null;
  INCLINATION?: string;
  ECCENTRICITY?: string;
  RA_OF_ASC_NODE?: string;
  ARG_OF_PERICENTER?: string;
  MEAN_MOTION?: string;
  APOAPSIS?: string;
  PERIAPSIS?: string;
  SEMIMAJOR_AXIS?: string;
  PERIOD?: string;
}

/**
 * 卫星数据服务
 * 从 Space-Track 获取卫星 TLE 和元数据
 * 数据存储在 PostgreSQL 数据库中
 */
@Injectable()
export class SpaceTrackService implements OnModuleInit {
  private readonly logger = new Logger(SpaceTrackService.name);
  private cachedTLEs: TLEData[] = [];
  private maxSatellites: number;
  private config: SpaceTrackConfig;
  private sessionCookie: string = '';
  private cookieExpiry: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SatelliteTle)
    private readonly tleRepository: Repository<SatelliteTle>,
    @InjectRepository(SatelliteMetadataEntity)
    private readonly metadataRepository: Repository<SatelliteMetadataEntity>,
  ) {
    this.maxSatellites = this.configService.get<number>('app.satellite.maxSatellites', 10000);
    this.config = {
      username: this.configService.get<string>('app.spaceTrack.username') || '',
      password: this.configService.get<string>('app.spaceTrack.password') || '',
      baseUrl: 'https://www.space-track.org',
    };
  }

  async onModuleInit() {
    // 检查配置
    if (!this.config.username || !this.config.password) {
      this.logger.error('Space-Track 凭据未配置，请检查环境变量 SPACE_TRACK_USERNAME 和 SPACE_TRACK_PASSWORD');
      return;
    }

    // 检查数据库是否有数据
    const tleCount = await this.tleRepository.count();
    const metadataCount = await this.metadataRepository.count();

    if (tleCount > 0 && metadataCount > 0) {
      this.logger.log(`从数据库加载卫星数据: ${tleCount} TLE, ${metadataCount} 元数据`);
      await this.loadFromDatabase();
    } else {
      // 首次启动，从网络获取数据
      this.logger.log('数据库为空，从 Space-Track 获取数据...');
      await this.refreshAllData();
    }
  }

  /**
   * 从数据库加载数据到内存
   */
  private async loadFromDatabase(): Promise<void> {
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
    if (!this.config.username || !this.config.password) {
      this.logger.warn('Space-Track 凭据未配置，跳过数据刷新');
      return;
    }

    this.logger.log('开始刷新卫星数据...');

    try {
      // 登录获取 session
      await this.login();

      // 从 Space-Track 获取 GP 数据
      const gpData = await this.fetchGpData();

      // 处理并存储数据
      await this.processAndStoreData(gpData);

      this.logger.log('卫星数据刷新完成');
    } catch (error) {
      this.logger.error(`刷新卫星数据失败: ${error.message}`);
    }
  }

  /**
   * 登录 Space-Track 获取 session cookie
   */
  private async login(): Promise<void> {
    const https = await import('https');
    const url = `${this.config.baseUrl}/ajaxauth/login`;

    this.logger.log('正在登录 Space-Track...');

    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Nova-Space/1.0',
          },
          timeout: 60000, // 60 秒超时
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            // 检查响应状态码
            if (res.statusCode !== 200) {
              this.logger.error(`Space-Track 登录失败，状态码: ${res.statusCode}`);
              reject(new Error(`登录失败，状态码: ${res.statusCode}`));
              return;
            }
            // 从响应头获取 cookie
            const cookies = res.headers['set-cookie'];
            if (cookies) {
              // 提取所有 cookie 值
              this.sessionCookie = cookies.map((c) => c.split(';')[0]).join('; ');
              // Cookie 有效期约 2 小时
              this.cookieExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);
              this.logger.log('Space-Track 登录成功');
              resolve();
            } else {
              this.logger.error('Space-Track 登录失败：未获取到 session cookie');
              reject(new Error('未获取到 session cookie'));
            }
          });
        },
      );

      req.on('error', (error) => {
        this.logger.error(`Space-Track 登录失败: ${error.message}`);
        reject(error);
      });

      req.on('timeout', () => {
        this.logger.error('Space-Track 登录超时');
        req.destroy();
        reject(new Error('登录超时'));
      });

      req.write(`identity=${encodeURIComponent(this.config.username)}&password=${encodeURIComponent(this.config.password)}`);
      req.end();
    });
  }

  /**
   * 确保 session 有效
   */
  private async ensureSession(): Promise<void> {
    if (!this.sessionCookie || !this.cookieExpiry || new Date() >= this.cookieExpiry) {
      await this.login();
    }
  }

  /**
   * 从 Space-Track 获取 GP 数据
   * URL: 获取活跃载荷的 TLE + 元数据
   */
  private async fetchGpData(): Promise<SpaceTrackGpResponse[]> {
    await this.ensureSession();

    const https = await import('https');
    // 获取活跃载荷（排除碎片和火箭体），未衰减，TLE 历元在最近 10 天内
    // 添加 limit 参数限制数量，开发环境可设置为较小值
    const limit = process.env.SPACE_TRACK_LIMIT ? `/limit/${process.env.SPACE_TRACK_LIMIT}` : '';
    const url = `${this.config.baseUrl}/basicspacedata/query/class/gp/OBJECT_TYPE/PAYLOAD/decay_date/null-val/epoch/%3Enow-10${limit}/format/json`;

    this.logger.log(`正在从 Space-Track 获取数据: ${url}`);

    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            Cookie: this.sessionCookie,
            'User-Agent': 'Nova-Space/1.0',
          },
          timeout: 180000, // 180 秒超时（数据量大）
        },
        (res) => {
          let data = '';
          const startTime = Date.now();

          this.logger.log(`Space-Track 响应状态码: ${res.statusCode}`);

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            this.logger.log(`Space-Track 数据接收完成，耗时 ${elapsed}s，大小 ${data.length} bytes`);

            try {
              // 检查是否是有效响应
              if (data.startsWith('<') || data.startsWith('Invalid')) {
                this.logger.error(`Space-Track API 返回错误: ${data.substring(0, 100)}`);
                reject(new Error(`Space-Track API 错误: ${data.substring(0, 50)}`));
                return;
              }

              const items: SpaceTrackGpResponse[] = JSON.parse(data);
              this.logger.log(`从 Space-Track 获取了 ${items.length} 条数据`);
              resolve(items);
            } catch (error) {
              this.logger.error(`解析 Space-Track 数据失败: ${error.message}`);
              reject(error);
            }
          });
        },
      );

      req.on('error', (error) => {
        this.logger.error(`Space-Track 网络请求失败: ${error.message}`);
        reject(error);
      });

      req.on('timeout', () => {
        this.logger.error('Space-Track 数据获取超时');
        req.destroy();
        reject(new Error('数据获取超时'));
      });
    });
  }

  /**
   * 处理并存储数据
   */
  private async processAndStoreData(gpData: SpaceTrackGpResponse[]): Promise<void> {
    const tleEntities: SatelliteTle[] = [];

    for (const item of gpData.slice(0, this.maxSatellites)) {
      // 创建 TLE 实体
      const tleEntity = new SatelliteTle();
      tleEntity.noradId = this.formatNoradId(item.NORAD_CAT_ID);
      tleEntity.name = item.OBJECT_NAME;
      tleEntity.line1 = item.TLE_LINE1;
      tleEntity.line2 = item.TLE_LINE2;

      if (item.EPOCH) {
        tleEntity.epoch = new Date(item.EPOCH);
      }

      // 解析轨道参数
      if (item.INCLINATION) tleEntity.inclination = parseFloat(item.INCLINATION);
      if (item.RA_OF_ASC_NODE) tleEntity.raan = parseFloat(item.RA_OF_ASC_NODE);
      if (item.ECCENTRICITY) tleEntity.eccentricity = parseFloat(item.ECCENTRICITY);
      if (item.ARG_OF_PERICENTER) tleEntity.argOfPerigee = parseFloat(item.ARG_OF_PERICENTER);
      if (item.MEAN_MOTION) tleEntity.meanMotion = parseFloat(item.MEAN_MOTION);

      tleEntities.push(tleEntity);

      // 更新或创建元数据
      await this.upsertMetadata(item);
    }

    // 批量保存 TLE 数据
    await this.tleRepository.clear();
    await this.tleRepository.save(tleEntities);

    // 更新内存缓存
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

    this.logger.log(`已刷新 ${this.cachedTLEs.length} 条 TLE 数据`);
  }

  /**
   * 更新或创建元数据
   */
  private async upsertMetadata(item: SpaceTrackGpResponse): Promise<void> {
    const noradId = this.formatNoradId(item.NORAD_CAT_ID);

    const existing = await this.metadataRepository.findOne({
      where: { noradId },
    });

    const metadataUpdate: Partial<SatelliteMetadataEntity> = {
      name: item.OBJECT_NAME,
      objectId: item.OBJECT_ID,
      countryCode: item.COUNTRY_CODE,
      launchDate: item.LAUNCH_DATE,
      launchSite: item.SITE,
      objectType: item.OBJECT_TYPE,
      rcs: item.RCS_SIZE,
      decayDate: item.DECAY_DATE || undefined,
      // 从轨道参数计算周期
      period: item.PERIOD ? parseFloat(item.PERIOD) : (item.MEAN_MOTION ? 1440 / parseFloat(item.MEAN_MOTION) : undefined),
      inclination: item.INCLINATION ? parseFloat(item.INCLINATION) : undefined,
      eccentricity: item.ECCENTRICITY ? parseFloat(item.ECCENTRICITY) : undefined,
      raan: item.RA_OF_ASC_NODE ? parseFloat(item.RA_OF_ASC_NODE) : undefined,
      argOfPerigee: item.ARG_OF_PERICENTER ? parseFloat(item.ARG_OF_PERICENTER) : undefined,
      // 远地点和近地点 (km)
      apogee: item.APOAPSIS ? parseFloat(item.APOAPSIS) : undefined,
      perigee: item.PERIAPSIS ? parseFloat(item.PERIAPSIS) : undefined,
    };

    // TLE 历元和数据年龄
    if (item.EPOCH) {
      const epochDate = new Date(item.EPOCH);
      metadataUpdate.tleEpoch = epochDate;
      // 计算 TLE 数据年龄（天数）
      const now = new Date();
      const ageMs = now.getTime() - epochDate.getTime();
      metadataUpdate.tleAge = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }

    if (existing) {
      // 保留 ESA DISCOS 扩展字段，只更新基础字段
      await this.metadataRepository.update(noradId, metadataUpdate);
    } else {
      // 新建记录
      const entity = new SatelliteMetadataEntity();
      entity.noradId = noradId;
      Object.assign(entity, metadataUpdate);
      entity.hasDiscosData = false;
      await this.metadataRepository.save(entity);
    }
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