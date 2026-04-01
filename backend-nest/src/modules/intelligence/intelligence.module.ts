import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';
import { Intelligence } from './entities/intelligence.entity';
import { IntelligenceCollect } from './entities/intelligence-collect.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Intelligence, IntelligenceCollect])],
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
