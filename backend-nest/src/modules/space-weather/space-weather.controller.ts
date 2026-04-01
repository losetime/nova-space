import { Controller, Get, Query } from '@nestjs/common';
import { SpaceWeatherService } from './space-weather.service';

@Controller('space-weather')
export class SpaceWeatherController {
  constructor(private readonly spaceWeatherService: SpaceWeatherService) {}

  /**
   * 获取当前空间天气状态
   * GET /api/space-weather/current
   */
  @Get('current')
  async getCurrentStatus() {
    const data = await this.spaceWeatherService.getCurrentStatus();
    return {
      code: 0,
      data,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取预警列表
   * GET /api/space-weather/alerts?limit=20
   */
  @Get('alerts')
  async getAlerts(@Query('limit') limit?: string) {
    const limitNum = parseInt(limit || '20') || 20;
    const data = await this.spaceWeatherService.getAlerts(limitNum);
    return {
      code: 0,
      data: {
        list: data,
        total: data.length,
      },
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取 X 射线通量数据
   * GET /api/space-weather/xray-flux?hours=6
   */
  @Get('xray-flux')
  async getXrayFlux(@Query('hours') hours?: string) {
    const hoursNum = parseInt(hours || '6') || 6;
    const data = await this.spaceWeatherService.getXrayFlux(hoursNum);
    return {
      code: 0,
      data,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }
}
