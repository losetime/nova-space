import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import type { TLEData } from '../interfaces/satellite.interface';

/**
 * SpaceTrack 服务
 * 从 Celestrak 获取卫星 TLE 数据，支持本地缓存备用
 */
@Injectable()
export class SpaceTrackService implements OnModuleInit {
  private readonly logger = new Logger(SpaceTrackService.name);
  private cachedTLEs: TLEData[] = [];
  private maxSatellites: number;

  constructor(private readonly configService: ConfigService) {
    this.maxSatellites = this.configService.get<number>('satellite.maxSatellites', 100);
  }

  async onModuleInit() {
    // 启动时加载卫星数据
    await this.loadSatellites();
  }

  /**
   * 获取缓存的 TLE 数据
   */
  getCachedTLEs(): TLEData[] {
    return this.cachedTLEs;
  }

  /**
   * 加载卫星数据
   */
  async loadSatellites(): Promise<TLEData[]> {
    this.logger.log('正在加载 Starlink 卫星 TLE 数据...');

    // 首先尝试从本地缓存加载
    const localCache = this.loadLocalCache();
    if (localCache.length > 0) {
      this.cachedTLEs = localCache.slice(0, this.maxSatellites);
      this.logger.log(`从本地缓存加载了 ${this.cachedTLEs.length} 颗 Starlink 卫星的 TLE 数据`);
      return this.cachedTLEs;
    }

    // 如果本地缓存不存在，尝试从网络获取
    try {
      const tleData = await this.fetchStarlinkTLEs();
      this.cachedTLEs = tleData;
      this.logger.log(`成功加载 ${tleData.length} 颗 Starlink 卫星的 TLE 数据`);
      return tleData;
    } catch (error) {
      this.logger.error(`加载卫星数据失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 从本地缓存加载 TLE 数据
   */
  private loadLocalCache(): TLEData[] {
    try {
      // 尝试多个可能的缓存路径
      const cachePaths = [
        path.join(process.cwd(), 'cache', 'starlink_tle_cache.json'),
        path.join(process.cwd(), '..', 'backend', 'cache', 'starlink_tle_cache.json'),
        path.join(__dirname, '..', '..', '..', '..', 'backend', 'cache', 'starlink_tle_cache.json'),
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
   * 从 Celestrak 获取 Starlink 卫星 TLE 数据
   */
  private async fetchStarlinkTLEs(): Promise<TLEData[]> {
    // 使用动态 import 避免编译错误
    const https = await import('https');

    return new Promise((resolve, reject) => {
      const url = 'https://celestrak.com/NORAD/elements/gp.php?NAME=Starlink&FORMAT=tle';

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

        // 只处理 Starlink 卫星
        if (name.toLowerCase().includes('starlink')) {
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
    }

    return tles;
  }
}