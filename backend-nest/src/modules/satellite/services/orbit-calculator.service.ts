import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as satellite from 'satellite.js';
import type { TLEData, SatellitePosition, OrbitPoint, SatelliteData, OrbitPrediction, PositionPrediction, ObserverPosition, PassEvent, PassPrediction } from '../interfaces/satellite.interface';
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
   * 计算单个卫星的轨道（增强版）
   * @param noradId 卫星 NORAD ID
   * @param steps 轨道点数（默认50）
   * @param startTime 开始时间（默认当前）
   * @param durationMinutes 持续时间（分钟，默认150）
   */
  calculateSatelliteOrbit(
    noradId: string,
    steps: number = 50,
    startTime?: Date,
    durationMinutes: number = 150,
  ): OrbitPoint[] {
    const sat = this.satellites.get(noradId);
    if (!sat) {
      return [];
    }

    const orbit: OrbitPoint[] = [];
    const start = startTime || new Date();
    const intervalMs = (durationMinutes * 60 * 1000) / steps;

    for (let i = 0; i < steps; i++) {
      const time = new Date(start.getTime() + i * intervalMs);
      const point = this.calculateOrbitPoint(sat, time);
      if (point) {
        orbit.push(point);
      }
    }

    return orbit;
  }

  /**
   * 计算轨道点
   */
  private calculateOrbitPoint(sat: SatelliteData, time: Date): OrbitPoint | null {
    try {
      const gmst = satellite.gstime(time);
      const eci = satellite.propagate(sat.satrec, time);

      if (eci && eci.position) {
        const gdPos = satellite.eciToGeodetic(eci.position, gmst);
        const latitude = satellite.radiansToDegrees(gdPos.latitude);
        const longitude = satellite.radiansToDegrees(gdPos.longitude);
        const altitude = gdPos.height * 1000; // 米

        const point: OrbitPoint = {
          lat: latitude,
          lng: longitude,
          alt: altitude,
          timestamp: time.toISOString(),
        };

        // 添加速度信息
        if (eci.velocity) {
          point.velocity = {
            x: eci.velocity.x,
            y: eci.velocity.y,
            z: eci.velocity.z,
          };
        }

        return point;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  /**
   * 轨道预测（完整版）
   * @param noradId 卫星 NORAD ID
   * @param startTime 开始时间
   * @param durationMinutes 持续时间（分钟）
   * @param steps 轨道点数
   */
  predictOrbit(
    noradId: string,
    startTime: Date,
    durationMinutes: number,
    steps: number = 100,
  ): OrbitPrediction | null {
    const sat = this.satellites.get(noradId);
    if (!sat) {
      return null;
    }

    const orbit: OrbitPoint[] = [];
    const intervalMs = (durationMinutes * 60 * 1000) / steps;

    for (let i = 0; i <= steps; i++) {
      const time = new Date(startTime.getTime() + i * intervalMs);
      const point = this.calculateOrbitPoint(sat, time);
      if (point) {
        orbit.push(point);
      }
    }

    // 计算轨道周期（近似）
    const orbitalPeriod = this.calculateOrbitalPeriod(sat);

    return {
      noradId: sat.noradId,
      name: sat.name,
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + durationMinutes * 60 * 1000).toISOString(),
      duration: durationMinutes,
      steps: orbit.length,
      orbit,
      orbitalPeriod,
    };
  }

  /**
   * 预测指定时间点的卫星位置
   * @param noradId 卫星 NORAD ID
   * @param time 预测时间
   */
  predictPosition(noradId: string, time: Date): PositionPrediction | null {
    const sat = this.satellites.get(noradId);
    if (!sat) {
      return null;
    }

    try {
      const gmst = satellite.gstime(time);
      const eci = satellite.propagate(sat.satrec, time);

      if (eci && eci.position && eci.velocity) {
        const gdPos = satellite.eciToGeodetic(eci.position, gmst);
        const latitude = satellite.radiansToDegrees(gdPos.latitude);
        const longitude = satellite.radiansToDegrees(gdPos.longitude);
        const altitude = gdPos.height * 1000; // 米

        // 计算总速度
        const totalVelocity = Math.sqrt(
          eci.velocity.x ** 2 + eci.velocity.y ** 2 + eci.velocity.z ** 2,
        );

        // 获取轨道信息
        const orbitalInfo = this.getOrbitalInfo(sat);

        return {
          noradId: sat.noradId,
          name: sat.name,
          timestamp: time.toISOString(),
          position: {
            lat: latitude,
            lng: longitude,
            alt: altitude,
          },
          velocity: {
            x: eci.velocity.x,
            y: eci.velocity.y,
            z: eci.velocity.z,
            total: totalVelocity,
          },
          orbitalInfo,
        };
      }
    } catch (error) {
      this.logger.error(`预测卫星 ${noradId} 位置错误: ${error.message}`);
      return null;
    }

    return null;
  }

  /**
   * 计算轨道周期（分钟）
   */
  private calculateOrbitalPeriod(sat: SatelliteData): number {
    try {
      // 使用 satellite.js 获取轨道参数
      const now = new Date();
      const positionAndVelocity = satellite.propagate(sat.satrec, now);
      
      if (positionAndVelocity && positionAndVelocity.position) {
        const positionEci = positionAndVelocity.position;
        const velocityEci = positionAndVelocity.velocity;
        
        // 计算轨道半径（km）
        const r = Math.sqrt(
          positionEci.x ** 2 + positionEci.y ** 2 + positionEci.z ** 2,
        );
        
        // 地球标准引力参数 (km³/s²)
        const mu = 398600.4418;
        
        // 轨道周期 T = 2π * sqrt(r³/μ) 秒
        const periodSeconds = 2 * Math.PI * Math.sqrt(r ** 3 / mu);
        
        // 转换为分钟
        return Math.round(periodSeconds / 60);
      }
    } catch (error) {
      // 默认返回约 90 分钟（LEO 卫星典型值）
      return 90;
    }
    
    return 90;
  }

  /**
   * 获取轨道信息
   */
  private getOrbitalInfo(sat: SatelliteData): { period: number; inclination: number; eccentricity: number } | undefined {
    try {
      // 从 TLE 数据中提取轨道参数
      // satellite.js 的 satrec 对象包含这些信息
      const satrec = sat.satrec;
      
      // 轨道倾角（弧度转角度）
      const inclination = satellite.radiansToDegrees(satrec.inclo || 0);
      
      // 离心率
      const eccentricity = satrec.ecco || 0;
      
      // 轨道周期
      const period = this.calculateOrbitalPeriod(sat);
      
      return {
        period,
        inclination: Math.round(inclination * 100) / 100,
        eccentricity: Math.round(eccentricity * 10000) / 10000,
      };
    } catch (error) {
      return undefined;
    }
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

  /**
   * 预测卫星过境
   * @param noradId 卫星 NORAD ID
   * @param observer 观察者位置
   * @param days 预测天数
   * @param minElevation 最小高度角（度）
   */
  predictPasses(
    noradId: string,
    observer: ObserverPosition,
    days: number = 7,
    minElevation: number = 10,
  ): PassPrediction | null {
    const sat = this.satellites.get(noradId);
    if (!sat) {
      return null;
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const passes: PassEvent[] = [];

    // 每分钟检查一次
    const stepMs = 60 * 1000;
    let currentPass: Partial<PassEvent> | null = null;
    let maxElevInPass = 0;
    let maxElevTime: Date | null = null;
    let maxAzimuth = 0;

    for (let t = now.getTime(); t < endDate.getTime(); t += stepMs) {
      const time = new Date(t);
      const lookAngles = this.calculateLookAngles(sat, observer, time);

      if (!lookAngles) continue;

      const elevation = lookAngles.elevation;
      const azimuth = lookAngles.azimuth;

      if (elevation >= minElevation) {
        // 卫星可见
        if (!currentPass) {
          // 开始新的过境
          currentPass = {
            startTime: time.toISOString(),
            startAzimuth: azimuth,
          };
          maxElevInPass = elevation;
          maxElevTime = time;
          maxAzimuth = azimuth;
        } else {
          // 更新最大高度角
          if (elevation > maxElevInPass) {
            maxElevInPass = elevation;
            maxElevTime = time;
            maxAzimuth = azimuth;
          }
        }
      } else {
        // 卫星不可见
        if (currentPass && currentPass.startTime) {
          // 结束过境
          const startTime = new Date(currentPass.startTime);
          const duration = Math.round((t - startTime.getTime()) / 1000);

          // 只记录持续超过1分钟的过境
          if (duration >= 60) {
            // 检查是否肉眼可见（太阳在地平线下，卫星被照亮）
            const visible = this.isVisuallyVisible(sat, observer, maxElevTime || time);

            passes.push({
              startTime: currentPass.startTime,
              endTime: time.toISOString(),
              maxElevationTime: maxElevTime?.toISOString() || time.toISOString(),
              maxElevation: Math.round(maxElevInPass * 10) / 10,
              startAzimuth: Math.round(currentPass.startAzimuth || 0),
              endAzimuth: Math.round(azimuth),
              maxAzimuth: Math.round(maxAzimuth),
              duration,
              visible,
            });
          }
          currentPass = null;
          maxElevInPass = 0;
          maxElevTime = null;
        }
      }
    }

    return {
      noradId: sat.noradId,
      name: sat.name,
      observer,
      passes,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      totalPasses: passes.length,
    };
  }

  /**
   * 计算卫星相对于观察者的方位角和高度角
   */
  private calculateLookAngles(
    sat: SatelliteData,
    observer: ObserverPosition,
    time: Date,
  ): { azimuth: number; elevation: number; range: number } | null {
    try {
      // 观察者位置（地心坐标系）
      const observerGd = {
        latitude: satellite.degreesToRadians(observer.lat),
        longitude: satellite.degreesToRadians(observer.lng),
        height: observer.alt / 1000, // 转换为 km
      };

      // 计算 GMST
      const gmst = satellite.gstime(time);

      // 计算卫星 ECI 位置
      const eci = satellite.propagate(sat.satrec, time);
      if (!eci || !eci.position) return null;

      // 计算观察者的 ECF 位置
      const observerEcf = satellite.geodeticToEcf(observerGd);

      // 计算卫星的 ECF 位置
      const satelliteEcf = satellite.eciToEcf(eci.position, gmst);

      // 计算观察角度
      const lookAngles = satellite.ecfToLookAngles(observerGd, satelliteEcf);

      return {
        azimuth: satellite.radiansToDegrees(lookAngles.azimuth),
        elevation: satellite.radiansToDegrees(lookAngles.elevation),
        range: lookAngles.rangeSat || 0,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查卫星是否肉眼可见（太阳在地平线下，卫星被照亮）
   * 简化版本：暂时返回 false，后续可添加太阳位置计算
   */
  private isVisuallyVisible(
    sat: SatelliteData,
    observer: ObserverPosition,
    time: Date,
  ): boolean {
    // TODO: 实现太阳位置计算，判断是否肉眼可见
    // 目前简化处理，返回 false
    return false;
  }
}