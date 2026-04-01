import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SatelliteController } from './satellite.controller';
import { SatelliteDataService } from './services/satellite-data.service';
import { OrbitCalculatorService } from './services/orbit-calculator.service';
import { SatelliteFavoriteService } from './services/satellite-favorite.service';
import { EsaDiscosService } from './services/esa-discos.service';
import { SatelliteGateway } from './gateways/satellite.gateway';
import { UserFavorite } from '../../common/entities/user-favorite.entity';
import { SatelliteTle, SatelliteMetadataEntity } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserFavorite,
      SatelliteTle,
      SatelliteMetadataEntity,
    ]),
  ],
  controllers: [SatelliteController],
  providers: [
    SatelliteDataService,
    OrbitCalculatorService,
    SatelliteFavoriteService,
    EsaDiscosService,
    SatelliteGateway,
  ],
  exports: [
    OrbitCalculatorService,
    SatelliteDataService,
    SatelliteFavoriteService,
    EsaDiscosService,
  ],
})
export class SatelliteModule {}
