import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { OrbitCalculatorService } from './services/orbit-calculator.service';
import type { OrbitPoint, OrbitPrediction, PositionPrediction, ObserverPosition } from './interfaces/satellite.interface';

/**
 * 卫星控制器
 * 提供卫星数据的 HTTP API
 */
@Controller('satellites')
export class SatelliteController {
  private readonly logger = new Logger(SatelliteController.name);

  constructor(private readonly orbitCalculator: OrbitCalculatorService) {}

  /**
   * 获取所有卫星的当前位置
   * GET /api/satellites
   */
  @Get()
  getAllSatellites() {
    this.logger.log('获取所有卫星位置');
    const satellites = this.orbitCalculator.calculateAllSatellitesPosition();
    return {
      code: 0,
      data: {
        satellites,
        count: satellites.length,
        total: this.orbitCalculator.getSatelliteCount(),
      },
      message: 'success',
    };
  }

  /**
   * 获取卫星统计信息
   * GET /api/satellites/stats
   */
  @Get('stats')
  getStats() {
    return {
      code: 0,
      data: {
        total: this.orbitCalculator.getSatelliteCount(),
        lastUpdate: new Date().toISOString(),
      },
      message: 'success',
    };
  }

  /**
   * 获取单个卫星的轨道数据
   * GET /api/satellites/:noradId/orbit
   * @param noradId 卫星 NORAD ID
   * @param steps 轨道点数（默认50，最大500）
   * @param startTime 开始时间（ISO格式，默认当前）
   * @param duration 持续时间（分钟，默认150，最大1440）
   */
  @Get(':noradId/orbit')
  getSatelliteOrbit(
    @Param('noradId') noradId: string,
    @Query('steps') steps?: string,
    @Query('startTime') startTime?: string,
    @Query('duration') duration?: string,
  ) {
    this.logger.log(`获取卫星 ${noradId} 的轨道数据`);

    const sat = this.orbitCalculator.getSatelliteInfo(noradId);
    if (!sat) {
      return {
        code: -1,
        data: null,
        message: '卫星不存在',
      };
    }

    // 解析参数
    const orbitSteps = Math.min(Math.max(parseInt(steps || '50') || 50, 10), 500);
    const durationMinutes = Math.min(Math.max(parseInt(duration || '150') || 150, 10), 1440);
    const start = startTime ? new Date(startTime) : new Date();

    // 验证时间
    if (isNaN(start.getTime())) {
      return {
        code: -1,
        data: null,
        message: '无效的开始时间格式',
      };
    }

    const orbit = this.orbitCalculator.calculateSatelliteOrbit(
      noradId,
      orbitSteps,
      start,
      durationMinutes,
    );

    return {
      code: 0,
      data: {
        noradId,
        name: sat.name,
        startTime: start.toISOString(),
        duration: durationMinutes,
        steps: orbitSteps,
        orbitPoints: orbit,
      },
      message: 'success',
    };
  }

  /**
   * 轨道预测（完整版）
   * GET /api/satellites/:noradId/predict
   * @param noradId 卫星 NORAD ID
   * @param startTime 开始时间（ISO格式，默认当前）
   * @param duration 持续时间（分钟，默认360，最大1440）
   * @param steps 轨道点数（默认100，最大500）
   */
  @Get(':noradId/predict')
  predictOrbit(
    @Param('noradId') noradId: string,
    @Query('startTime') startTime?: string,
    @Query('duration') duration?: string,
    @Query('steps') steps?: string,
  ) {
    this.logger.log(`预测卫星 ${noradId} 的轨道`);

    const sat = this.orbitCalculator.getSatelliteInfo(noradId);
    if (!sat) {
      return {
        code: -1,
        data: null,
        message: '卫星不存在',
      };
    }

    // 解析参数
    const orbitSteps = Math.min(Math.max(parseInt(steps || '100') || 100, 10), 500);
    const durationMinutes = Math.min(Math.max(parseInt(duration || '360') || 360, 10), 1440);
    const start = startTime ? new Date(startTime) : new Date();

    // 验证时间
    if (isNaN(start.getTime())) {
      return {
        code: -1,
        data: null,
        message: '无效的开始时间格式',
      };
    }

    const prediction = this.orbitCalculator.predictOrbit(
      noradId,
      start,
      durationMinutes,
      orbitSteps,
    );

    return {
      code: 0,
      data: prediction,
      message: 'success',
    };
  }

  /**
   * 预测指定时间点的卫星位置
   * GET /api/satellites/:noradId/position
   * @param noradId 卫星 NORAD ID
   * @param time 预测时间（ISO格式，默认当前）
   */
  @Get(':noradId/position')
  predictPosition(
    @Param('noradId') noradId: string,
    @Query('time') time?: string,
  ) {
    this.logger.log(`预测卫星 ${noradId} 在指定时间的位置`);

    const sat = this.orbitCalculator.getSatelliteInfo(noradId);
    if (!sat) {
      return {
        code: -1,
        data: null,
        message: '卫星不存在',
      };
    }

    const targetTime = time ? new Date(time) : new Date();

    // 验证时间
    if (isNaN(targetTime.getTime())) {
      return {
        code: -1,
        data: null,
        message: '无效的时间格式',
      };
    }

    const prediction = this.orbitCalculator.predictPosition(noradId, targetTime);

    return {
      code: 0,
      data: prediction,
      message: 'success',
    };
  }

  /**
   * 预测卫星过境
   * GET /api/satellites/:noradId/passes
   * @param noradId 卫星 NORAD ID
   * @param lat 观察者纬度（度）
   * @param lng 观察者经度（度）
   * @param alt 观察者海拔（米，默认0）
   * @param days 预测天数（默认7，最大30）
   * @param minElevation 最小高度角（度，默认10）
   */
  @Get(':noradId/passes')
  predictPasses(
    @Param('noradId') noradId: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('alt') alt?: string,
    @Query('days') days?: string,
    @Query('minElevation') minElevation?: string,
  ) {
    this.logger.log(`预测卫星 ${noradId} 的过境`);

    const sat = this.orbitCalculator.getSatelliteInfo(noradId);
    if (!sat) {
      return {
        code: -1,
        data: null,
        message: '卫星不存在',
      };
    }

    // 验证必需参数
    if (!lat || !lng) {
      return {
        code: -1,
        data: null,
        message: '缺少观察者位置参数（lat, lng）',
      };
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        code: -1,
        data: null,
        message: '无效的经纬度参数',
      };
    }

    if (latitude < -90 || latitude > 90) {
      return {
        code: -1,
        data: null,
        message: '纬度必须在 -90 到 90 之间',
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        code: -1,
        data: null,
        message: '经度必须在 -180 到 180 之间',
      };
    }

    const observer: ObserverPosition = {
      lat: latitude,
      lng: longitude,
      alt: parseFloat(alt || '0') || 0,
    };

    const predictionDays = Math.min(Math.max(parseInt(days || '7') || 7, 1), 30);
    const minElev = Math.min(Math.max(parseFloat(minElevation || '10') || 10, 0), 90);

    const prediction = this.orbitCalculator.predictPasses(
      noradId,
      observer,
      predictionDays,
      minElev,
    );

    return {
      code: 0,
      data: prediction,
      message: 'success',
    };
  }

  /**
   * 获取单个卫星的当前位置
   * GET /api/satellites/:noradId
   */
  @Get(':noradId')
  getSatellite(@Param('noradId') noradId: string) {
    this.logger.log(`获取卫星 ${noradId} 的位置`);

    const sat = this.orbitCalculator.getSatelliteInfo(noradId);
    if (!sat) {
      return {
        code: -1,
        data: null,
        message: '卫星不存在',
      };
    }

    const positions = this.orbitCalculator.calculateAllSatellitesPosition();
    const position = positions.find((p) => p.noradId === noradId);

    return {
      code: 0,
      data: position || null,
      message: position ? 'success' : '无法计算卫星位置',
    };
  }
}