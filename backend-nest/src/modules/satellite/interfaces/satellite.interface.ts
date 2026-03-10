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
}

/**
 * 卫星数据接口（用于计算）
 */
export interface SatelliteData {
  name: string;
  noradId: string;
  satrec: any;
}