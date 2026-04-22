import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from '../../../db/drizzle.module';
import type { DrizzleClient } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import type { SatelliteMetadata } from '../interfaces/satellite.interface';

@Injectable()
export class EsaDiscosService {
  private readonly logger = new Logger(EsaDiscosService.name);
  private readonly apiToken: string | undefined;
  private readonly baseUrl = 'https://discosweb.esoc.esa.int/api';

  constructor(
    private readonly configService: ConfigService,
    @Inject(DRIZZLE) private db: DrizzleClient,
  ) {
    this.apiToken = this.configService.get<string>('app.esaDiscos.apiToken');
  }

  isConfigured(): boolean {
    return !!this.apiToken;
  }

  async enrichSatelliteMetadata(
    noradId: string,
  ): Promise<SatelliteMetadata | null> {
    const [entity] = await this.db
      .select()
      .from(schema.satelliteMetadata)
      .where(eq(schema.satelliteMetadata.noradId, noradId));

    if (!entity) return null;

    return this.entityToMetadata(entity);
  }

  private entityToMetadata(
    entity: schema.SatelliteMetadata,
  ): SatelliteMetadata {
    let tleAge: number | undefined;
    if (entity.tleEpoch) {
      const ageMs = Date.now() - entity.tleEpoch.getTime();
      tleAge = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }

    return {
      noradId: entity.noradId,
      name: entity.name,
      objectId: entity.objectId,
      altName: entity.altName ?? undefined,
      objectType: entity.objectType,
      status: entity.status,
      countryCode: entity.countryCode,
      launchDate: entity.launchDate?.toISOString().split('T')[0] ?? null,
      launchSite: entity.launchSite,
      launchVehicle: entity.launchVehicle,
      decayDate: entity.decayDate?.toISOString().split('T')[0] ?? null,
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
      cosparId: entity.cosparId,
      objectClass: entity.objectClass,
      launchMass: entity.launchMass,
      dryMass: entity.dryMass ?? undefined,
      length: entity.length ?? undefined,
      diameter: entity.diameter ?? undefined,
      shape: entity.shape,
      dimensions: entity.dimensions,
      span: entity.span,
      mission: entity.mission,
      firstEpoch: entity.firstEpoch?.toISOString().split('T')[0] ?? null,
      operator: entity.operator,
      contractor: entity.contractor,
      lifetime: entity.lifetime,
      equipment: entity.equipment ?? undefined,
      payload: entity.payload ?? undefined,
      platform: entity.platform,
      predDecayDate: entity.predDecayDate?.toISOString().split('T')[0] ?? null,
      flightNo: entity.flightNo,
      cosparLaunchNo: entity.cosparLaunchNo,
      launchFailure: entity.launchFailure,
      launchSiteName: entity.launchSiteName,
      purpose: entity.purpose ?? undefined,
      bus: entity.bus ?? undefined,
      constellationName: entity.constellationName ?? undefined,
      adcs: entity.adcs ?? undefined,
      manufacturer: entity.manufacturer ?? undefined,
      configuration: entity.configuration ?? undefined,
      power: entity.power ?? undefined,
      motor: entity.motor ?? undefined,
      summary: entity.summary ?? undefined,
      stable_date: entity.stableDate?.toISOString().split('T')[0] ?? null,
      launch_pad: entity.launchPad ?? undefined,
      material_composition: entity.materialComposition ?? undefined,
      major_events: entity.majorEvents ?? undefined,
      related_satellites: entity.relatedSatellites ?? undefined,
      transmitter_frequencies: entity.transmitterFrequencies ?? undefined,
    };
  }
}
