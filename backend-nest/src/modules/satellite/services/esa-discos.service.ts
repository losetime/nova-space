import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SatelliteMetadataEntity } from '../entities/satellite-metadata.entity';
import type { SatelliteMetadata } from '../interfaces/satellite.interface';

/**
 * ESA DISCOS API 响应结构
 */
interface DiscosResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      cosparId?: string;
      satno?: number;
      name?: string;
      objectClass?: string;
      mass?: number;
      shape?: string;
      width?: number;
      height?: number;
      depth?: number;
      span?: number;
      mission?: string;
      firstEpoch?: string;
      predDecayDate?: string;
    };
    relationships?: {
      operators?: {
        data?: Array<{ type: string; id: string }>;
      };
      launch?: {
        data?: { type: string; id: string } | null;
      };
      tags?: {
        data?: Array<{ type: string; id: string }>;
      };
      constellations?: {
        data?: Array<{ type: string; id: string }>;
      };
    };
  }>;
  included?: Array<{
    type: string;
    id: string;
    attributes: {
      name?: string;
      flightNo?: string;
      cosparLaunchNo?: string;
      failure?: boolean;
    };
    relationships?: {
      vehicle?: {
        data?: { type: string; id: string };
      };
      site?: {
        data?: { type: string; id: string };
      };
    };
  }>;
}

/**
 * ESA DISCOS 卫星信息
 */
interface DiscosSatelliteInfo {
  cosparId?: string;
  objectClass?: string;
  mass?: number;
  shape?: string;
  width?: number;
  height?: number;
  depth?: number;
  span?: number;
  mission?: string;
  firstEpoch?: string;
  operator?: string;
  predDecayDate?: string;
  launchVehicle?: string;
  flightNo?: string;
  cosparLaunchNo?: string;
  launchFailure?: boolean;
  launchSiteName?: string;
}

/**
 * ESA DISCOS 服务
 * 从 ESA DISCOS API 获取卫星扩展信息（质量、尺寸等）
 * 采用懒加载策略，数据存入数据库长期有效
 */
@Injectable()
export class EsaDiscosService {
  private readonly logger = new Logger(EsaDiscosService.name);
  private readonly apiToken: string | undefined;
  private readonly baseUrl = 'https://discosweb.esoc.esa.int/api';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SatelliteMetadataEntity)
    private readonly metadataRepository: Repository<SatelliteMetadataEntity>,
  ) {
    this.apiToken = this.configService.get<string>('app.esaDiscos.apiToken');
  }

  /**
   * 检查 API 是否已配置
   */
  isConfigured(): boolean {
    return !!this.apiToken;
  }

  /**
   * 获取卫星扩展信息
   * 优先从数据库读取，无则从 API 获取并存储
   */
  async enrichSatelliteMetadata(noradId: string): Promise<SatelliteMetadata | null> {
    // 从数据库获取现有元数据
    const entity = await this.metadataRepository.findOne({
      where: { noradId },
    });

    if (!entity) {
      return null;
    }

    // 如果已有 ESA DISCOS 数据，直接返回
    if (entity.hasDiscosData) {
      return this.entityToMetadata(entity);
    }

    // 未配置 API，返回基础数据
    if (!this.isConfigured()) {
      return this.entityToMetadata(entity);
    }

    // 从 ESA DISCOS 获取扩展信息
    try {
      const discosInfo = await this.fetchFromApi(noradId);

      if (discosInfo) {
        // 更新数据库
        await this.updateMetadataWithDiscos(noradId, discosInfo);

        // 重新获取更新后的数据
        const updated = await this.metadataRepository.findOne({
          where: { noradId },
        });

        if (updated) {
          this.logger.log(`已从 ESA DISCOS 获取扩展数据: ${noradId}`);
          return this.entityToMetadata(updated);
        }
      }
    } catch (error) {
      this.logger.warn(`获取 ESA DISCOS 数据失败 (${noradId}): ${error.message}`);
    }

    // 失败时返回基础数据
    return this.entityToMetadata(entity);
  }

  /**
   * 从 ESA DISCOS API 获取卫星信息
   */
  private async fetchFromApi(noradId: string): Promise<DiscosSatelliteInfo | null> {
    if (!this.apiToken) {
      return null;
    }

    try {
      // 移除前导零，ESA DISCOS 使用纯数字
      const numericId = parseInt(noradId, 10);
      // 一次性获取运营商、发射信息、运载工具、发射场
      const url = `${this.baseUrl}/objects?filter=satno=${numericId}&include=operators,launch,launch.vehicle,launch.site`;
      this.logger.debug(`请求 ESA DISCOS API: ${url}`);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          Accept: 'application/vnd.api+json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`ESA DISCOS API 请求失败: HTTP ${response.status}`);
        return null;
      }

      const json: DiscosResponse = await response.json();

      if (!json.data || json.data.length === 0) {
        this.logger.debug(`ESA DISCOS 未找到卫星: ${noradId}`);
        return null;
      }

      const item = json.data[0];
      const attrs = item.attributes;
      const included = json.included || [];

      // 解析运营商信息
      let operator: string | undefined;
      if (item.relationships?.operators?.data?.length) {
        const operatorId = item.relationships.operators.data[0]?.id;
        if (operatorId) {
          const operatorData = included.find(
            (inc) => inc.type === 'organisation' && inc.id === operatorId,
          );
          operator = operatorData?.attributes?.name;
        }
      }

      // 解析发射信息
      let launchVehicle: string | undefined;
      let flightNo: string | undefined;
      let cosparLaunchNo: string | undefined;
      let launchFailure: boolean | undefined;
      let launchSiteName: string | undefined;

      if (item.relationships?.launch?.data && item.relationships.launch.data) {
        const launchId = item.relationships.launch.data.id;
        const launchData = included.find(
          (inc) => inc.type === 'launch' && inc.id === launchId,
        );

        if (launchData) {
          flightNo = launchData.attributes?.flightNo;
          cosparLaunchNo = launchData.attributes?.cosparLaunchNo;
          launchFailure = launchData.attributes?.failure;

          // 获取运载工具
          if (launchData.relationships?.vehicle?.data) {
            const vehicleId = launchData.relationships.vehicle.data.id;
            const vehicleData = included.find(
              (inc) => inc.type === 'vehicle' && inc.id === vehicleId,
            );
            launchVehicle = vehicleData?.attributes?.name;
          }

          // 获取发射场
          if (launchData.relationships?.site?.data) {
            const siteId = launchData.relationships.site.data.id;
            const siteData = included.find(
              (inc) => inc.type === 'launchSite' && inc.id === siteId,
            );
            launchSiteName = siteData?.attributes?.name;
          }
        }
      }

      return {
        cosparId: attrs.cosparId,
        objectClass: attrs.objectClass,
        mass: attrs.mass,
        shape: attrs.shape,
        width: attrs.width,
        height: attrs.height,
        depth: attrs.depth,
        span: attrs.span,
        mission: attrs.mission,
        firstEpoch: attrs.firstEpoch,
        operator,
        predDecayDate: attrs.predDecayDate,
        launchVehicle,
        flightNo,
        cosparLaunchNo,
        launchFailure,
        launchSiteName,
      };
    } catch (error) {
      this.logger.error(`ESA DISCOS API 请求失败 (${noradId}): ${error.message}`);
      return null;
    }
  }

  /**
   * 更新元数据，添加 ESA DISCOS 扩展信息
   */
  private async updateMetadataWithDiscos(
    noradId: string,
    info: DiscosSatelliteInfo,
  ): Promise<void> {
    const updateData: Partial<SatelliteMetadataEntity> = {
      // 仅更新未填充的字段
      cosparId: info.cosparId,
      objectClass: info.objectClass,
      launchMass: info.mass,
      shape: info.shape,
      dimensions: this.formatDimensions(info),
      span: info.span,
      mission: info.mission,
      firstEpoch: info.firstEpoch,
      operator: info.operator,
      predDecayDate: info.predDecayDate,
      hasDiscosData: true,
    };

    // 如果 ESA DISCOS 有发射信息，更新这些字段（仅当原值为空时）
    if (info.launchVehicle) {
      updateData.launchVehicle = info.launchVehicle;
    }
    if (info.flightNo) {
      updateData.flightNo = info.flightNo;
    }
    if (info.cosparLaunchNo) {
      updateData.cosparLaunchNo = info.cosparLaunchNo;
    }
    if (info.launchFailure !== undefined) {
      updateData.launchFailure = info.launchFailure;
    }
    if (info.launchSiteName) {
      updateData.launchSiteName = info.launchSiteName;
    }

    await this.metadataRepository.update(noradId, updateData);
  }

  /**
   * 格式化尺寸显示
   */
  private formatDimensions(info: DiscosSatelliteInfo): string | undefined {
    if (!info.width && !info.height && !info.depth) {
      return undefined;
    }
    const parts: string[] = [];
    if (info.width) parts.push(`${info.width}m`);
    if (info.height) parts.push(`${info.height}m`);
    if (info.depth) parts.push(`${info.depth}m`);
    return parts.length > 0 ? parts.join(' × ') : undefined;
  }

  /**
   * 实体转接口
   */
  private entityToMetadata(entity: SatelliteMetadataEntity): SatelliteMetadata {
    // 动态计算 TLE 数据年龄
    let tleAge: number | undefined;
    if (entity.tleEpoch) {
      const ageMs = Date.now() - entity.tleEpoch.getTime();
      tleAge = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }

    return {
      noradId: entity.noradId,
      name: entity.name,
      objectId: entity.objectId,
      altNames: entity.altNames,
      objectType: entity.objectType,
      status: entity.status,
      countryCode: entity.countryCode,
      launchDate: entity.launchDate,
      launchSite: entity.launchSite,
      launchVehicle: entity.launchVehicle,
      decayDate: entity.decayDate,
      period: entity.period,
      inclination: entity.inclination,
      apogee: entity.apogee,
      perigee: entity.perigee,
      eccentricity: entity.eccentricity,
      raan: entity.raan,
      argOfPerigee: entity.argOfPerigee,
      rcs: entity.rcs,
      stdMag: entity.stdMag,
      tleEpoch: entity.tleEpoch?.toISOString(),
      tleAge,
      // ESA DISCOS 扩展字段
      cosparId: entity.cosparId,
      objectClass: entity.objectClass,
      launchMass: entity.launchMass,
      shape: entity.shape,
      dimensions: entity.dimensions,
      span: entity.span,
      mission: entity.mission,
      firstEpoch: entity.firstEpoch,
      operator: entity.operator,
      purpose: entity.purpose,
      contractor: entity.contractor,
      lifetime: entity.lifetime,
      platform: entity.platform,
      predDecayDate: entity.predDecayDate,
      // 发射扩展信息
      flightNo: entity.flightNo,
      cosparLaunchNo: entity.cosparLaunchNo,
      launchFailure: entity.launchFailure,
      launchSiteName: entity.launchSiteName,
    };
  }
}