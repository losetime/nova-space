import { Module } from '@nestjs/common';
import { SpaceWeatherController } from './space-weather.controller';
import { SpaceWeatherService } from './space-weather.service';

/**
 * 空间天气模块
 * 
 * 提供空间天气数据的获取和处理功能
 * 数据来源：NOAA SWPC (Space Weather Prediction Center)
 * 
 * API 端点：
 * - GET /api/space-weather/current - 获取当前空间天气状态
 * - GET /api/space-weather/alerts - 获取预警列表
 * - GET /api/space-weather/xray-flux - 获取X射线通量数据
 * - GET /api/space-weather/overview - 获取综合概览
 */
@Module({
  controllers: [SpaceWeatherController],
  providers: [SpaceWeatherService],
  exports: [SpaceWeatherService],
})
export class SpaceWeatherModule {}