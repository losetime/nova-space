/**
 * TLE 数据接口
 */
export interface TLEData {
  name: string;
  noradId: string;
  line1: string;
  line2: string;
}

/**
 * 卫星位置接口
 */
export interface SatellitePosition {
  noradId: string;
  name: string;
  position: {
    lat: number;
    lng: number;
    alt: number;
  };
  timestamp?: string;
}

/**
 * 轨道点接口
 */
export interface OrbitPoint {
  lat: number;
  lng: number;
  alt: number;
  timestamp?: string; // 时间戳
  velocity?: {
    x: number;
    y: number;
    z: number;
  }; // 速度向量 (km/s)
}

/**
 * 轨道预测结果接口
 */
export interface OrbitPrediction {
  noradId: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number; // 分钟
  steps: number;
  orbit: OrbitPoint[];
  orbitalPeriod?: number; // 轨道周期（分钟）
}

/**
 * 单点位置预测接口
 */
export interface PositionPrediction {
  noradId: string;
  name: string;
  timestamp: string;
  position: {
    lat: number;
    lng: number;
    alt: number; // 米
  };
  velocity: {
    x: number;
    y: number;
    z: number;
    total: number; // km/s
  };
  orbitalInfo?: {
    period: number; // 轨道周期（分钟）
    inclination: number; // 轨道倾角（度）
    eccentricity: number; // 离心率
  };
}

/**
 * 卫星数据接口（用于计算）
 */
export interface SatelliteData {
  name: string;
  noradId: string;
  satrec: any;
}

/**
 * 观察者位置接口
 */
export interface ObserverPosition {
  lat: number;  // 纬度（度）
  lng: number;  // 经度（度）
  alt: number;  // 海拔（米）
}

/**
 * 过境事件接口
 */
export interface PassEvent {
  startTime: string;       // 过境开始时间
  endTime: string;         // 过境结束时间
  maxElevationTime: string; // 最大高度角时间
  maxElevation: number;    // 最大高度角（度）
  startAzimuth: number;    // 起始方位角（度）
  endAzimuth: number;      // 结束方位角（度）
  maxAzimuth: number;      // 最大高度时的方位角
  duration: number;        // 持续时间（秒）
  visible: boolean;        // 是否肉眼可见（考虑光照）
}

/**
 * 过境预测结果接口
 */
export interface PassPrediction {
  noradId: string;
  name: string;
  observer: ObserverPosition;
  passes: PassEvent[];
  startDate: string;
  endDate: string;
  totalPasses: number;
}