import { Controller, Get, Param, Logger } from '@nestjs/common';
import { OrbitCalculatorService } from './services/orbit-calculator.service';
import type { OrbitPoint } from './interfaces/satellite.interface';

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
   */
  @Get(':noradId/orbit')
  getSatelliteOrbit(@Param('noradId') noradId: string) {
    this.logger.log(`获取卫星 ${noradId} 的轨道数据`);

    const sat = this.orbitCalculator.getSatelliteInfo(noradId);
    if (!sat) {
      return {
        code: -1,
        data: null,
        message: '卫星不存在',
      };
    }

    const orbit = this.orbitCalculator.calculateSatelliteOrbit(noradId, 50);
    return {
      code: 0,
      data: {
        noradId,
        name: sat.name,
        orbitPoints: orbit,
      },
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