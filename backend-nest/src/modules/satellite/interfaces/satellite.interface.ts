/**
 * TLE 数据接口
 */
export interface TLEData {
  name: string;
  noradId: string;
  line1: string;
  line2: string;
  // 从TLE解析的轨道参数
  epoch?: string;          // 历元时间
  eccentricity?: number;   // 偏心率
  raan?: number;           // 升交点赤经（度）
  argOfPerigee?: number;   // 近地点幅角（度）
  inclination?: number;    // 轨道倾角（度）
  meanMotion?: number;     // 平均运动（转/天）
}

/**
 * 卫星元数据接口
 */
export interface SatelliteMetadata {
  noradId: string;
  name?: string;
  objectId?: string;       // 国际编号（如 2023-001A）
  altNames?: string[];     // 别名列表
  objectType?: string;     // 对象类型（PAYLOAD/ROCKET BODY/DEBRIS）
  status?: string;         // 在轨状态（+/D/P/N/A）
  countryCode?: string;    // 所有者/国家
  launchDate?: string;     // 发射日期
  launchSite?: string;     // 发射地点
  launchVehicle?: string;  // 运载工具
  decayDate?: string;      // 衰减日期
  period?: number;         // 轨道周期（分钟）
  inclination?: number;    // 轨道倾角（度）
  apogee?: number;         // 远地点高度（km）
  perigee?: number;        // 近地点高度（km）
  eccentricity?: number;   // 偏心率
  raan?: number;           // 升交点赤经（度）
  argOfPerigee?: number;   // 近地点幅角（度）
  rcs?: string;            // 雷达截面（LARGE/MEDIUM/SMALL 或数值）
  stdMag?: number;         // 标准星等
  tleEpoch?: string;       // TLE历元时间
  tleAge?: number;         // TLE数据年龄（天）

  // N2YO 扩展字段
  mission?: string;        // 任务描述
  operator?: string;       // 运营商
  purpose?: string;        // 用途
  contractor?: string;     // 制造商
  launchMass?: number;     // 发射质量 (kg)
  lifetime?: string;       // 设计寿命
  platform?: string;       // 卫星平台

  // ESA DISCOS 扩展字段
  cosparId?: string;       // COSPAR 编号 (ESA 格式)
  objectClass?: string;    // 对象类型 (Payload/Debris - ESA 分类)
  shape?: string;          // 形状代码
  dimensions?: string;     // 尺寸显示 "72.8m × 20.0m × 108.5m"
  span?: number;           // 最大跨度 (米)
  firstEpoch?: string;     // 首次轨道历元
  predDecayDate?: string;  // 预测衰减日期

  // 发射扩展信息 (ESA DISCOS)
  flightNo?: string;           // 发射序号
  cosparLaunchNo?: string;     // COSPAR 发射编号
  launchFailure?: boolean;     // 发射是否失败
  launchSiteName?: string;     // 发射场名称
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