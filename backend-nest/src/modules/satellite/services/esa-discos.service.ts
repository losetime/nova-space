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
      altNames: entity.altNames ? entity.altNames.split(',') : undefined,
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
      cosparId: entity.cosparId,
      objectClass: entity.objectClass,
      launchMass: entity.launchMass,
      shape: entity.shape,
      dimensions: entity.dimensions,
      span: entity.span,
      mission: entity.mission,
      firstEpoch: entity.firstEpoch,
      operator: entity.operator,
      contractor: entity.contractor,
      lifetime: entity.lifetime,
      platform: entity.platform,
      predDecayDate: entity.predDecayDate,
      flightNo: entity.flightNo,
      cosparLaunchNo: entity.cosparLaunchNo,
      launchFailure: entity.launchFailure,
      launchSiteName: entity.launchSiteName,
    };
  }
}
