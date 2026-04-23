import { Module } from '@nestjs/common';
import { SatelliteController } from './satellite.controller';
import { SatelliteDataService } from './services/satellite-data.service';
import { OrbitCalculatorService } from './services/orbit-calculator.service';
import { SatelliteFavoriteService } from './services/satellite-favorite.service';
import { SatelliteMetadataService } from './services/satellite-metadata.service';

@Module({
  controllers: [SatelliteController],
  providers: [
    SatelliteDataService,
    OrbitCalculatorService,
    SatelliteFavoriteService,
    SatelliteMetadataService,
  ],
  exports: [
    OrbitCalculatorService,
    SatelliteDataService,
    SatelliteFavoriteService,
    SatelliteMetadataService,
  ],
})
export class SatelliteModule {}
