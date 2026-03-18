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
          return tles;
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
    // CelesTrak SATCAT API - 获取 GPZ 数据的元数据
    // SPECIAL=gpz 返回有 GP 数据的活跃卫星元数据
    const url = 'https://celestrak.org/satcat/records.php?SPECIAL=gpz&FORMAT=json';

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
                  objectType: item.OBJECT_TYPE,
                  countryCode: item.OWNER,  // OWNER 字段包含国家/所有者代码
                  launchDate: item.LAUNCH_DATE,
                  launchSite: item.LAUNCH_SITE,
                  decayDate: item.DECAY_DATE || undefined,
                  period: item.PERIOD,
                  inclination: item.INCLINATION,
                  apogee: item.APOGEE,
                  perigee: item.PERIGEE,
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
            metadata.forEach((item: any) => {
              const noradId = this.formatNoradId(item.NORAD_CAT_ID);
              this.satelliteMetadata.set(noradId, {
                noradId,
                name: item.OBJECT_NAME || item.SATNAME,
                objectId: item.OBJECT_ID || item.INTLDES,
                objectType: item.OBJECT_TYPE,
                countryCode: item.COUNTRY,  // Space-Track 使用 COUNTRY 字段
                launchDate: item.LAUNCH || undefined,
                launchSite: item.SITE || undefined,
                decayDate: item.DECAY || undefined,
                // 轨道参数
                period: item.PERIOD ? parseFloat(item.PERIOD) : undefined,
                inclination: item.INCLINATION ? parseFloat(item.INCLINATION) : undefined,
                apogee: item.APOGEE ? parseFloat(item.APOGEE) : undefined,
                perigee: item.PERIGEE ? parseFloat(item.PERIGEE) : undefined,
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

        // 提取 NORAD ID
        const noradIdMatch = line1.match(/^1 (\d{5})/);
        const noradId = noradIdMatch ? noradIdMatch[1] : null;

        if (noradId) {
          tles.push({
            name,
            noradId,
            line1,
            line2,
          });
        }
      }
    }

    return tles;
  }
}