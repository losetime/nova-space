import { Injectable, Logger, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import type { DrizzleClient } from '../../db';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface CompanyStats {
  operatorCount: number;
  contractorCount: number;
  manufacturerCount: number;
}

export interface SatelliteBrief {
  noradId: string;
  name: string;
}

export interface CompanyDetail {
  name: string;
  country: string | null;
  foundedYear: number | null;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  stats: CompanyStats;
  satellites: {
    asOperator: SatelliteBrief[];
    asContractor: SatelliteBrief[];
    asManufacturer: SatelliteBrief[];
  };
}

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(@Inject(DRIZZLE) private db: DrizzleClient) {}

  async getCompanyByName(name: string): Promise<CompanyDetail> {
    const [company] = await this.db
      .select()
      .from(schema.company)
      .where(eq(schema.company.name, name));

    const tleData = await this.db.select().from(schema.satelliteTle);
    const tleNoradIds = new Set(tleData.map((tle) => tle.noradId));

    const operatorSatellites = await this.db
      .select()
      .from(schema.satelliteMetadata)
      .where(eq(schema.satelliteMetadata.operator, name));

    const contractorSatellites = await this.db
      .select()
      .from(schema.satelliteMetadata)
      .where(eq(schema.satelliteMetadata.contractor, name));

    const manufacturerSatellites = await this.db
      .select()
      .from(schema.satelliteMetadata)
      .where(eq(schema.satelliteMetadata.manufacturer, name));

    const filterByTLE = (
      sats: schema.SatelliteMetadata[],
    ): SatelliteBrief[] => {
      return sats
        .filter((sat) => tleNoradIds.has(sat.noradId))
        .map((sat) => ({
          noradId: sat.noradId,
          name: sat.name || sat.noradId,
        }));
    };

    const stats: CompanyStats = {
      operatorCount: filterByTLE(operatorSatellites).length,
      contractorCount: filterByTLE(contractorSatellites).length,
      manufacturerCount: filterByTLE(manufacturerSatellites).length,
    };

    const satellites = {
      asOperator: filterByTLE(operatorSatellites),
      asContractor: filterByTLE(contractorSatellites),
      asManufacturer: filterByTLE(manufacturerSatellites),
    };

    if (!company) {
      return {
        name,
        country: null,
        foundedYear: null,
        website: null,
        logoUrl: null,
        description: null,
        stats,
        satellites,
      };
    }

    return {
      name: company.name,
      country: company.country,
      foundedYear: company.foundedYear,
      website: company.website,
      logoUrl: company.logoUrl,
      description: company.description,
      stats,
      satellites,
    };
  }
}
