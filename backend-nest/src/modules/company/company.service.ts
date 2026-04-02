import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from './entities/company.entity';
import { SatelliteMetadataEntity } from '../satellite/entities/satellite-metadata.entity';
import { SatelliteTle } from '../satellite/entities/satellite-tle.entity';

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

  constructor(
    @InjectRepository(CompanyEntity)
    private companyRepository: Repository<CompanyEntity>,
    @InjectRepository(SatelliteMetadataEntity)
    private metadataRepository: Repository<SatelliteMetadataEntity>,
    @InjectRepository(SatelliteTle)
    private tleRepository: Repository<SatelliteTle>,
  ) {}

  async getCompanyByName(name: string): Promise<CompanyDetail> {
    const company = await this.companyRepository.findOne({
      where: { name },
    });

    const tleData = await this.tleRepository.find();
    const tleNoradIds = new Set(tleData.map((tle) => tle.noradId));

    const operatorSatellites = await this.metadataRepository.find({
      where: { operator: name },
    });

    const contractorSatellites = await this.metadataRepository.find({
      where: { contractor: name },
    });

    const manufacturerSatellites = await this.metadataRepository.find({
      where: { manufacturer: name },
    });

    const filterByTLE = (sats: SatelliteMetadataEntity[]): SatelliteBrief[] => {
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
