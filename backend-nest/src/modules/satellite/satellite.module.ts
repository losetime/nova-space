import { Module } from '@nestjs/common';
import { SatelliteController } from './satellite.controller';
import { SatelliteDataService } from './services/satellite-data.service';
import { OrbitCalculatorService } from './services/orbit-calculator.service';
import { SatelliteFavoriteService } from './services/satellite-favorite.service';
import { EsaDiscosService } from './services/esa-discos.service';

@Module({
  controllers: [SatelliteController],
  providers: [
    SatelliteDataService,
    OrbitCalculatorService,
    SatelliteFavoriteService,
    EsaDiscosService,
  ],
  exports: [
    OrbitCalculatorService,
    SatelliteDataService,
    SatelliteFavoriteService,
    EsaDiscosService,
  ],
})
export class SatelliteModule {}