import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import type { TLEData, SatelliteMetadata } from '../interfaces/satellite.interface';

/**
 * 卫星分类配置
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
 * SpaceTrack 服务
 * 从 Celestrak 获取卫星 TLE 数据，支持本地缓存备用
 * 支持获取全球所有活跃卫星数据
 * 元数据优先从 Space-Track API 获取（完整），失败时回退到 CelesTrak GPZ
 */
@Injectable()
export class SpaceTrackService implements OnModuleInit {
  private readonly logger = new Logger(SpaceTrackService.name);
  private cachedTLEs: TLEData[] = [];
  private satelliteMetadata: Map<string, SatelliteMetadata> = new Map();
  private maxSatellites: number;
  private dataGroup: string;
  private spaceTrackCookies: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.maxSatellites = this.configService.get<number>('satellite.maxSatellites', 10000);
    this.dataGroup = this.configService.get<string>('satellite.dataGroup', 'active');
  }

  async onModuleInit() {
    // 启动时加载卫星数据
    await this.loadSatellites();
    // 加载卫星元数据（优先本地缓存，然后尝试网络更新）
    try {
      await this.loadMetadataWithFallback();
    } catch (err) {
      this.logger.error(`加载卫星元数据失败: ${err.message}`);
    }
    // 合并TLE轨道参数到元数据
    this.mergeTLEParamsToMetadata();
  }

  /**
   * 加载卫星元数据（优先 Space-Track，失败则回退到 CelesTrak）
   */
  private async loadMetadataWithFallback(): Promise<void> {
    // 首先尝试从本地缓存加载元数据
    const localMetadata = this.loadLocalMetadataCache();
    if (localMetadata.length > 0) {
      localMetadata.forEach((item) => {
        this.satelliteMetadata.set(item.noradId, item);
      });
      this.logger.log(`从本地缓存加载了 ${this.satelliteMetadata.size} 条元数据`);
      return;
    }

    const spaceTrackConfig = this.configService.get<{ username: string; password: string }>('app.spaceTrack');

    // 如果配置了 Space-Track 凭据，优先使用
    if (spaceTrackConfig?.username && spaceTrackConfig?.password) {
      try {
        this.logger.log('尝试从 Space-Track 获取完整卫星目录...');
        await this.fetchSatcatFromSpaceTrack();
        this.logger.log(`从 Space-Track 加载了 ${this.satelliteMetadata.size} 条元数据`);
        // 保存到本地缓存
        this.saveLocalMetadataCache();
        return;
      } catch (error) {
        this.logger.warn(`Space-Track 加载失败，回退到 CelesTrak: ${error.message}`);
      }
    } else {
      this.logger.log('未配置 Space-Track 凭据，使用 CelesTrak 获取元数据');
    }

    // 回退到 CelesTrak GPZ
    try {
      await this.loadSatelliteMetadata();
      // 保存到本地缓存
      this.saveLocalMetadataCache();
    } catch (error) {
      this.logger.error(`CelesTrak 元数据加载失败: ${error.message}`);
    }
  }

  /**
   * 从本地缓存加载元数据
   */
  private loadLocalMetadataCache(): SatelliteMetadata[] {
    try {
      const cachePaths = [
        path.join(process.cwd(), 'cache', 'satellite_metadata_cache.json'),
        path.join(__dirname, '..', '..', '..', '..', 'backend', 'cache', 'satellite_metadata_cache.json'),
      ];

      for (const cachePath of cachePaths) {
        if (fs.existsSync(cachePath)) {
          this.logger.log(`找到元数据本地缓存: ${cachePath}`);
          const data = fs.readFileSync(cachePath, 'utf-8');
          return JSON.parse(data);
        }
      }
      return [];
    } catch (error) {
      this.logger.error(`读取元数据本地缓存失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 保存元数据到本地缓存
   */
  private saveLocalMetadataCache(): void {
    try {
      const cacheDir = path.join(process.cwd(), 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      const cachePath = path.join(cacheDir, 'satellite_metadata_cache.json');
      const data = Array.from(this.satelliteMetadata.values());
      fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
      this.logger.log(`已保存 ${data.length} 条元数据到本地缓存`);
    } catch (error) {
      this.logger.error(`保存元数据缓存失败: ${error.message}`);
    }
  }

  /**
   * 格式化 NORAD ID 为 5 位字符串（补零）
   * 确保 TLE 解析的 NORAD ID 与元数据中的格式一致
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
   * 获取卫星元数据
   */
  getSatelliteMetadata(noradId: string): SatelliteMetadata | undefined {
    return this.satelliteMetadata.get(noradId);
  }

  /**
   * 获取所有卫星元数据
   */
  getAllMetadata(): Map<string, SatelliteMetadata> {
    return this.satelliteMetadata;
  }

  /**
   * 合并TLE轨道参数到元数据
   * 从TLE数据中提取偏心率、RAAN、近地点幅角等参数，并计算TLE数据年龄
   */
  private mergeTLEParamsToMetadata(): void {
    const now = new Date();
    let mergedCount = 0;

    for (const tle of this.cachedTLEs) {
      const metadata = this.satelliteMetadata.get(tle.noradId);
      if (metadata && tle.epoch) {
        // 合并TLE解析的轨道参数
        metadata.eccentricity = tle.eccentricity;
        metadata.raan = tle.raan;
        metadata.argOfPerigee = tle.argOfPerigee;
        metadata.tleEpoch = tle.epoch;

        // 计算TLE数据年龄（天）
        const epochDate = new Date(tle.epoch);
        const ageMs = now.getTime() - epochDate.getTime();
        metadata.tleAge = Math.floor(ageMs / (1000 * 60 * 60 * 24));

        mergedCount++;
      }
    }

    this.logger.log(`合并了 ${mergedCount} 颗卫星的TLE轨道参数到元数据`);
  }

  /**
   * 加载卫星数据
   */
  async loadSatellites(): Promise<TLEData[]> {
    this.logger.log(`正在加载卫星 TLE 数据（数据源: ${this.dataGroup}）...`);

    // 首先尝试从本地缓存加载
    const localCache = this.loadLocalCache();
    if (localCache.length > 0) {
      this.cachedTLEs = localCache.slice(0, this.maxSatellites);
      this.logger.log(`从本地缓存加载了 ${this.cachedTLEs.length} 颗卫星的 TLE 数据`);
      return this.cachedTLEs;
    }

    // 如果本地缓存不存在，尝试从网络获取
    try {
      const tleData = await this.fetchSatelliteTLEs();
      this.cachedTLEs = tleData;
      this.logger.log(`成功加载 ${tleData.length} 颗卫星的 TLE 数据`);
      return tleData;
    } catch (error) {
      this.logger.error(`加载卫星数据失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 刷新卫星数据（从网络重新获取）
   */
  async refreshSatellites(): Promise<TLEData[]> {
    this.logger.log('正在刷新卫星数据...');
    try {
      const tleData = await this.fetchSatelliteTLEs();
      this.cachedTLEs = tleData;
      this.logger.log(`成功刷新 ${tleData.length} 颗卫星的 TLE 数据`);
      return tleData;
    } catch (error) {
      this.logger.error(`刷新卫星数据失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 从本地缓存加载 TLE 数据
   */
  private loadLocalCache(): TLEData[] {
    try {
      // 尝试多个可能的缓存路径
      const cachePaths = [
        path.join(process.cwd(), 'cache', 'satellites_tle_cache.json'),
        path.join(process.cwd(), 'cache', 'starlink_tle_cache.json'), // 兼容旧缓存
        path.join(process.cwd(), '..', 'backend', 'cache', 'satellites_tle_cache.json'),
        path.join(__dirname, '..', '..', '..', '..', 'backend', 'cache', 'satellites_tle_cache.json'),
      ];

      for (const cachePath of cachePaths) {
        if (fs.existsSync(cachePath)) {
          this.logger.log(`找到本地缓存: ${cachePath}`);
          const data = fs.readFileSync(cachePath, 'utf-8');
          const tles: TLEData[] = JSON.parse(data);
          // 确保缓存数据包含轨道参数（兼容旧缓存格式）
          return tles.map((tle) => this.ensureOrbitalParams(tle));
        }
      }

      this.logger.warn('未找到本地 TLE 缓存文件');
      return [];
    } catch (error) {
      this.logger.error(`读取本地缓存失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 确保 TLE 数据包含轨道参数
   * 如果缓存数据缺少 epoch 等参数，从 TLE 行重新解析
   */
  private ensureOrbitalParams(tle: TLEData): TLEData {
    // 如果已经有 epoch，说明是新格式，直接返回
    if (tle.epoch) {
      return tle;
    }
    // 从 TLE 行重新解析轨道参数
    if (tle.line1 && tle.line2) {
      const orbitalParams = this.parseOrbitalParams(tle.line1, tle.line2);
      return { ...tle, ...orbitalParams };
    }
    return tle;
  }

  /**
   * 从 Celestrak 获取卫星 TLE 数据
   */
  private async fetchSatelliteTLEs(): Promise<TLEData[]> {
    // 使用动态 import 避免编译错误
    const https = await import('https');

    // 获取数据源 URL
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
              // 限制返回数量
              const limitedTles = tles.slice(0, this.maxSatellites);
              // 保存到本地缓存
              this.saveLocalTLECache(limitedTles);
              resolve(limitedTles);
            } catch (error) {
              reject(error);
            }
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * 保存 TLE 数据到本地缓存
   */
  private saveLocalTLECache(tles: TLEData[]): void {
    try {
      const cacheDir = path.join(process.cwd(), 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      const cachePath = path.join(cacheDir, 'satellites_tle_cache.json');
      fs.writeFileSync(cachePath, JSON.stringify(tles, null, 2));
      this.logger.log(`已保存 ${tles.length} 条 TLE 数据到本地缓存: ${cachePath}`);
    } catch (error) {
      this.logger.error(`保存 TLE 缓存失败: ${error.message}`);
    }
  }

  /**
   * 加载卫星元数据
   */
  private async loadSatelliteMetadata(): Promise<void> {
    const https = await import('https');
    // CelesTrak SATCAT API - 获取完整卫星目录
    const url = 'https://celestrak.org/satcat/records.php?FORMAT=json';

    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const metadata = JSON.parse(data);
              metadata.forEach((item: any) => {
                const noradId = this.formatNoradId(item.NORAD_CAT_ID);
                this.satelliteMetadata.set(noradId, {
                  noradId,
                  name: item.OBJECT_NAME,
                  objectId: item.OBJECT_ID,
                  altNames: item.ALT_NAMES ? item.ALT_NAMES.split(',') : undefined,
                  objectType: item.OBJECT_TYPE,
                  status: item.STATUS,
                  countryCode: item.OWNER,
                  launchDate: item.LAUNCH_DATE,
                  launchSite: item.LAUNCH_SITE,
                  decayDate: item.DECAY_DATE || undefined,
                  period: item.PERIOD,
                  inclination: item.INCLINATION,
                  apogee: item.APOGEE,
                  perigee: item.PERIGEE,
                  rcs: item.RCS,
                  stdMag: item.STD_MAG ? parseFloat(item.STD_MAG) : undefined,
                });
              });
              this.logger.log(`加载了 ${this.satelliteMetadata.size} 条卫星元数据`);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * 登录 Space-Track 获取 session cookie
   */
  private async loginSpaceTrack(): Promise<string> {
    const https = await import('https');
    const spaceTrackConfig = this.configService.get<{
      username: string;
      password: string;
      baseUrl: string;
    }>('app.spaceTrack');

    if (!spaceTrackConfig) {
      throw new Error('Space-Track 配置不存在');
    }

    const { username, password } = spaceTrackConfig;

    return new Promise((resolve, reject) => {
      const postData = `identity=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

      const options = {
        hostname: 'www.space-track.org',
        path: '/ajaxauth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Space-Track 登录失败: HTTP ${res.statusCode}`));
            return;
          }

          // 提取 set-cookie 头
          const cookies = res.headers['set-cookie'];
          if (cookies && cookies.length > 0) {
            // 合并所有 cookie
            const cookieString = cookies.map((c) => c.split(';')[0]).join('; ');
            this.spaceTrackCookies = cookieString;
            resolve(cookieString);
          } else {
            reject(new Error('Space-Track 登录成功但未获取到 cookie'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 从 Space-Track 获取完整卫星目录元数据
   */
  private async fetchSatcatFromSpaceTrack(): Promise<void> {
    const https = await import('https');

    // 先登录获取 cookie
    const cookies = await this.loginSpaceTrack();

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.space-track.org',
        path: '/basicspacedata/query/class/satcat/format/json',
        method: 'GET',
        headers: {
          Cookie: cookies,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              reject(new Error(`Space-Track API 错误: HTTP ${res.statusCode}`));
              return;
            }

            const metadata = JSON.parse(data);

            // 清空现有元数据
            this.satelliteMetadata.clear();

            // 解析并存储元数据
            // Space-Track satcat 表字段：
            // INTLDES, NORAD_CAT_ID, OBJECT_TYPE, SATNAME, COUNTRY, LAUNCH, SITE, DECAY,
            // PERIOD, INCLINATION, APOGEE, PERIGEE, RCSVALUE, RCS_SIZE, CURRENT, OBJECT_NAME, OBJECT_ID
            metadata.forEach((item: any) => {
              const noradId = this.formatNoradId(item.NORAD_CAT_ID);

              // CURRENT 字段: "Y" = 在轨, 其他 = 已衰减
              // RCS_SIZE: LARGE, MEDIUM, SMALL 或空
              this.satelliteMetadata.set(noradId, {
                noradId,
                name: item.OBJECT_NAME || item.SATNAME,
                objectId: item.OBJECT_ID || item.INTLDES,
                objectType: item.OBJECT_TYPE,
                status: item.CURRENT === 'Y' ? '+' : 'D',  // + 表示在轨, D 表示已衰减
                countryCode: item.COUNTRY,
                launchDate: item.LAUNCH || undefined,
                launchSite: item.SITE || undefined,
                launchVehicle: undefined,  // Space-Track satcat 不含此字段
                decayDate: item.DECAY || undefined,
                // 轨道参数
                period: item.PERIOD ? parseFloat(item.PERIOD) : undefined,
                inclination: item.INCLINATION ? parseFloat(item.INCLINATION) : undefined,
                apogee: item.APOGEE ? parseFloat(item.APOGEE) : undefined,
                perigee: item.PERIGEE ? parseFloat(item.PERIGEE) : undefined,
                rcs: item.RCS_SIZE || undefined,
              });
            });

            this.logger.log(`从 Space-Track 解析了 ${this.satelliteMetadata.size} 条元数据`);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
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

        // 提取 NORAD ID（格式化为 5 位补零，与元数据保持一致）
        const noradIdMatch = line1.match(/^1 (\d{5})/);
        const noradId = noradIdMatch ? this.formatNoradId(noradIdMatch[1]) : null;

        if (noradId) {
          // 解析轨道参数
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
      // 从 Line 1 提取历元 (位置 19-32)
      // 格式: YYDDD.DDDDDDDD (年份 + 年内天数)
      const epochStr = line1.substring(18, 32).trim();
      if (epochStr) {
        params.epoch = this.parseTLEEpoch(epochStr);
      }

      // 从 Line 2 提取轨道参数
      // 轨道倾角 (位置 9-16)
      const inclination = parseFloat(line2.substring(8, 16).trim());
      if (!isNaN(inclination)) {
        params.inclination = inclination;
      }

      // 升交点赤经 (位置 18-25)
      const raan = parseFloat(line2.substring(17, 25).trim());
      if (!isNaN(raan)) {
        params.raan = raan;
      }

      // 偏心率 (位置 27-33，需要加小数点)
      const eccentricityStr = line2.substring(26, 33).trim();
      if (eccentricityStr) {
        params.eccentricity = parseFloat('0.' + eccentricityStr);
      }

      // 近地点幅角 (位置 35-42)
      const argOfPerigee = parseFloat(line2.substring(34, 42).trim());
      if (!isNaN(argOfPerigee)) {
        params.argOfPerigee = argOfPerigee;
      }

      // 平均运动 (位置 53-63)
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
   * 解析 TLE 历元时间为 ISO 字符串
   * TLE 格式: YYDDD.DDDDDDDD (年份后两位 + 年内天数)
   */
  private parseTLEEpoch(epochStr: string): string {
    try {
      const year = parseInt(epochStr.substring(0, 2));
      const dayOfYear = parseFloat(epochStr.substring(2));

      // 确定完整年份 (假设 57-99 是 1957-1999, 00-56 是 2000-2056)
      const fullYear = year >= 57 ? 1900 + year : 2000 + year;

      // 计算日期
      const date = new Date(fullYear, 0, 1);
      date.setDate(date.getDate() + Math.floor(dayOfYear) - 1);

      // 添加小数部分的时间
      const fractionalDay = dayOfYear - Math.floor(dayOfYear);
      const hours = fractionalDay * 24;
      date.setHours(Math.floor(hours), Math.floor((hours % 1) * 60), Math.floor(((hours * 60) % 1) * 60));

      return date.toISOString();
    } catch {
      return epochStr;
    }
  }
}