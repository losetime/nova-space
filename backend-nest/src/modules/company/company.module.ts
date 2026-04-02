import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyEntity } from './entities/company.entity';
import { SatelliteMetadataEntity } from '../satellite/entities/satellite-metadata.entity';
import { SatelliteTle } from '../satellite/entities/satellite-tle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      SatelliteMetadataEntity,
      SatelliteTle,
    ]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
