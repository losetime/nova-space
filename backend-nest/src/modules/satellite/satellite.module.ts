import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SatelliteController } from './satellite.controller';
import { SpaceTrackService } from './services/space-track.service';
import { OrbitCalculatorService } from './services/orbit-calculator.service';
import { SatelliteFavoriteService } from './services/satellite-favorite.service';
import { SatelliteGateway } from './gateways/satellite.gateway';
import { UserFavorite } from '../../common/entities/user-favorite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserFavorite])],
  controllers: [SatelliteController],
  providers: [SpaceTrackService, OrbitCalculatorService, SatelliteFavoriteService, SatelliteGateway],
  exports: [OrbitCalculatorService, SpaceTrackService, SatelliteFavoriteService],
})
export class SatelliteModule {}