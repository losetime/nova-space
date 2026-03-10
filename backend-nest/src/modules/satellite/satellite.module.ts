import { Module } from '@nestjs/common';
import { SatelliteController } from './satellite.controller';
import { SpaceTrackService } from './services/space-track.service';
import { OrbitCalculatorService } from './services/orbit-calculator.service';
import { SatelliteGateway } from './gateways/satellite.gateway';

@Module({
  controllers: [SatelliteController],
  providers: [SpaceTrackService, OrbitCalculatorService, SatelliteGateway],
  exports: [OrbitCalculatorService, SpaceTrackService],
})
export class SatelliteModule {}