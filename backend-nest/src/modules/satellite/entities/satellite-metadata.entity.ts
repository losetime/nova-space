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
  purpose: string; // 用途

  @Column({ type: 'varchar', length: 100, nullable: true })
  contractor: string; // 制造商

  @Column({ type: 'varchar', length: 50, nullable: true })
  lifetime: string; // 设计寿命

  @Column({ type: 'varchar', length: 100, nullable: true })
  platform: string; // 卫星平台

  // 数据来源标记
  @Column({ type: 'boolean', default: false })
  hasDiscosData: boolean; // 是否已获取 ESA DISCOS 数据

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}