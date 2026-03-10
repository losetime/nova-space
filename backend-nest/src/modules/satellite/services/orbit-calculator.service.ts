import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as satellite from 'satellite.js';
import type { TLEData, SatellitePosition, OrbitPoint, SatelliteData } from '../interfaces/satellite.interface';
import { SpaceTrackService } from './space-track.service';

/**
 * 轨道计算服务
 * 使用 satellite.js 计算卫星位置和轨道
 */
@Injectable()
export class OrbitCalculatorService implements OnModuleInit {
  private readonly logger = new Logger(OrbitCalculatorService.name);
  private satellites: Map<string, SatelliteData> = new Map();

  constructor(private readonly spaceTrackService: SpaceTrackService) {}

  async onModuleInit() {
    // 等待 SpaceTrackService 加载完数据后初始化
    setTimeout(() => {
      this.loadSatellites();
    }, 2000);
  }

  /**
   * 加载卫星数据
   */
  loadSatellites(): void {
    const tles = this.spaceTrackService.getCachedTLEs();
    this.satellites.clear();

    tles.forEach((tle) => {
      try {
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
        this.satellites.set(tle.noradId, {
          name: tle.name,
          noradId: tle.noradId,
          satrec,
        });
      } catch (error) {
        this.logger.error(`解析卫星 ${tle.noradId} TLE 错误: ${error.message}`);
      }
    });

    this.logger.log(`已加载 ${this.satellites.size} 颗卫星`);
  }

  /**
   * 获取卫星数量
   */
  getSatelliteCount(): number {
    return this.satellites.size;
  }

  /**
   * 计算所有卫星的当前位置
   */
  calculateAllSatellitesPosition(): SatellitePosition[] {
    const now = new Date();
    const positionData: SatellitePosition[] = [];

    this.satellites.forEach((sat, noradId) => {
      try {
        const position = this.calculateSatellitePosition(sat, now);
        if (position) {
          positionData.push(position);
        }
      } catch (error) {
        // 静默处理单个卫星计算错误
      }
    });

    return positionData;
  }

  /**
   * 计算单个卫星的当前位置
   */
  private calculateSatellitePosition(sat: SatelliteData, time: Date): SatellitePosition | null {
    try {
      const gmst = satellite.gstime(time);
      const eci = satellite.propagate(sat.satrec, time);

      if (eci && eci.position && eci.velocity) {
        const gdPos = satellite.eciToGeodetic(eci.position, gmst);
        const latitude = satellite.radiansToDegrees(gdPos.latitude);
        const longitude = satellite.radiansToDegrees(gdPos.longitude);
        const altitude = gdPos.height * 1000; // 转换为米

        return {
          noradId: sat.noradId,
          name: sat.name,
          position: {
            lat: latitude,
            lng: longitude,
            alt: altitude,
          },
          timestamp: time.toISOString(),
        };
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  /**
   * 计算单个卫星的轨道
   */
  calculateSatelliteOrbit(noradId: string, steps: number = 50): OrbitPoint[] {
    const sat = this.satellites.get(noradId);
    if (!sat) {
      return [];
    }

    const orbit: OrbitPoint[] = [];
    const now = new Date();

    // 计算未来轨道，每步 3 分钟
    for (let i = 0; i < steps; i++) {
      const time = new Date(now.getTime() + i * 3 * 60 * 1000);
      const gmst = satellite.gstime(time);
      const eci = satellite.propagate(sat.satrec, time);

      if (eci && eci.position) {
        const gdPos = satellite.eciToGeodetic(eci.position, gmst);
        const latitude = satellite.radiansToDegrees(gdPos.latitude);
        const longitude = satellite.radiansToDegrees(gdPos.longitude);
        const altitude = gdPos.height * 1000;

        orbit.push({
          lat: latitude,
          lng: longitude,
          alt: altitude,
        });
      }
    }

    return orbit;
  }

  /**
   * 获取所有卫星的 NORAD ID 列表
   */
  getAllSatelliteIds(): string[] {
    return Array.from(this.satellites.keys());
  }

  /**
   * 获取卫星信息
   */
  getSatelliteInfo(noradId: string): SatelliteData | undefined {
    return this.satellites.get(noradId);
  }
}