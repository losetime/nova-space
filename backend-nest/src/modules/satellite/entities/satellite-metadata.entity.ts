import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 卫星元数据实体
 * 存储卫星详细信息，包括 CelesTrak 基础数据和 ESA DISCOS 扩展数据
 */
@Entity('satellite_metadata')
@Index(['countryCode'])
@Index(['objectType'])
@Index(['launchDate'])
export class SatelliteMetadataEntity {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  noradId: string;

  // 基础信息
  @Column({ type: 'varchar', length: 200, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  objectId: string; // COSPAR ID (如 2023-001A)

  @Column({ type: 'simple-array', nullable: true })
  altNames: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  objectType: string; // PAYLOAD/ROCKET BODY/DEBRIS

  @Column({ type: 'varchar', length: 10, nullable: true })
  status: string; // +/D/P/N/A

  @Column({ type: 'varchar', length: 50, nullable: true })
  countryCode: string;

  // 发射信息
  @Column({ type: 'date', nullable: true })
  launchDate: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  launchSite: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  launchVehicle: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  flightNo: string; // 发射序号

  @Column({ type: 'varchar', length: 20, nullable: true })
  cosparLaunchNo: string; // COSPAR 发射编号

  @Column({ type: 'boolean', nullable: true })
  launchFailure: boolean; // 发射是否失败

  @Column({ type: 'varchar', length: 100, nullable: true })
  launchSiteName: string; // 发射场名称

  @Column({ type: 'date', nullable: true })
  decayDate: string;

  // 轨道参数
  @Column({ type: 'float', nullable: true })
  period: number;

  @Column({ type: 'float', nullable: true })
  inclination: number;

  @Column({ type: 'float', nullable: true })
  apogee: number;

  @Column({ type: 'float', nullable: true })
  perigee: number;

  @Column({ type: 'float', nullable: true })
  eccentricity: number;

  @Column({ type: 'float', nullable: true })
  raan: number;

  @Column({ type: 'float', nullable: true })
  argOfPerigee: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rcs: string; // LARGE/MEDIUM/SMALL 或数值

  @Column({ type: 'float', nullable: true })
  stdMag: number;

  // TLE 相关
  @Column({ type: 'timestamp', nullable: true })
  tleEpoch: Date;

  @Column({ type: 'int', nullable: true })
  tleAge: number; // 天数

  // ========== ESA DISCOS 扩展字段 ==========
  @Column({ type: 'varchar', length: 20, nullable: true })
  cosparId: string; // COSPAR 编号 (ESA 格式)

  @Column({ type: 'varchar', length: 20, nullable: true })
  objectClass: string; // Payload/Debris (ESA 分类)

  @Column({ type: 'float', nullable: true })
  launchMass: number; // 发射质量 (kg)

  @Column({ type: 'varchar', length: 20, nullable: true })
  shape: string; // 形状代码

  @Column({ type: 'varchar', length: 50, nullable: true })
  dimensions: string; // 尺寸显示 "72.8m × 20.0m × 108.5m"

  @Column({ type: 'float', nullable: true })
  span: number; // 最大跨度 (米)

  @Column({ type: 'varchar', length: 100, nullable: true })
  mission: string; // 任务类型

  @Column({ type: 'date', nullable: true })
  firstEpoch: string; // 首次轨道历元

  @Column({ type: 'varchar', length: 100, nullable: true })
  operator: string; // 运营商

  @Column({ type: 'varchar', length: 100, nullable: true })
  contractor: string; // 制造商

  @Column({ type: 'varchar', length: 50, nullable: true })
  lifetime: string; // 设计寿命

  @Column({ type: 'varchar', length: 100, nullable: true })
  platform: string; // 卫星平台

  @Column({ type: 'date', nullable: true })
  predDecayDate: string; // 预测衰减日期

  // 数据来源标记
  @Column({ type: 'boolean', default: false })
  hasDiscosData: boolean; // 是否已获取 ESA DISCOS 数据

  @Column({ type: 'boolean', default: false })
  hasKeepTrackData: boolean; // 是否已获取 KeepTrack 数据

  @Column({ type: 'boolean', default: false })
  hasSpaceTrackData: boolean; // 是否已获取 Space-Track 数据

  // ========== Space-Track 扩展字段（保留但暂不使用） ==========
  @Column({ type: 'text', nullable: true })
  purpose: string; // 用途（暂不使用，统一使用 mission）

  // ========== KeepTrack 扩展字段 ==========
  @Column({ type: 'varchar', length: 100, nullable: true })
  bus: string; // 卫星总线

  @Column({ type: 'float', nullable: true })
  length: number; // 长度 (米)

  @Column({ type: 'float', nullable: true })
  diameter: number; // 直径 (米)

  @Column({ type: 'float', nullable: true })
  dryMass: number; // 干质量 (kg)

  @Column({ type: 'varchar', length: 100, nullable: true })
  constellationName: string; // 星座名称

  @Column({ type: 'text', nullable: true })
  equipment: string; // 设备信息

  @Column({ type: 'text', nullable: true })
  adcs: string; // 姿态控制系统

  @Column({ type: 'text', nullable: true })
  payload: string; // 有效载荷

  @Column({ type: 'varchar', length: 100, nullable: true })
  alt_name: string; // 别名

  @Column({ type: 'date', nullable: true })
  stable_date: string; // 稳定日期

  @Column({ type: 'varchar', length: 50, nullable: true })
  launch_pad: string; // 发射工位

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string; // 制造商

  @Column({ type: 'varchar', length: 100, nullable: true })
  configuration: string; // 配置

  @Column({ type: 'text', nullable: true })
  power: string; // 电源系统

  @Column({ type: 'text', nullable: true })
  motor: string; // 推进系统

  @Column({ type: 'varchar', length: 100, nullable: true })
  color: string; // 颜色

  @Column({ type: 'text', nullable: true })
  material_composition: string; // 材料组成

  @Column({ type: 'text', nullable: true })
  major_events: string; // 主要事件

  @Column({ type: 'text', nullable: true })
  related_satellites: string; // 相关卫星

  @Column({ type: 'text', nullable: true })
  transmitter_frequencies: string; // 发射频率

  @Column({ type: 'text', nullable: true })
  sources: string; // 数据来源

  @Column({ type: 'text', nullable: true })
  reference_urls: string; // 参考链接

  @Column({ type: 'text', nullable: true })
  summary: string; // 摘要

  @Column({ type: 'varchar', length: 50, nullable: true })
  anomaly_flags: string; // 异常标记

  @Column({ type: 'timestamp', nullable: true })
  last_reviewed: Date; // 最后审核时间

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
