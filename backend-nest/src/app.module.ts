import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { PointsModule } from './modules/points/points.module';
import { SatelliteModule } from './modules/satellite/satellite.module';
import { AllExceptionsFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';
import { EducationModule } from './modules/education/education.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { NotificationModule } from './modules/notification/notification.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { SpaceWeatherModule } from './modules/space-weather/space-weather.module';
import { PushModule } from './modules/push/push.module';
import { MilestoneModule } from './modules/milestone/milestone.module';
import { CompanyModule } from './modules/company/company.module';
import { SatelliteTle } from './modules/satellite/entities/satellite-tle.entity';
import { SatelliteMetadataEntity } from './modules/satellite/entities/satellite-metadata.entity';
import { User } from './common/entities/user.entity';
import { Article } from './modules/education/entities/article.entity';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('app.database.host'),
        port: configService.get<number>('app.database.port'),
        username: configService.get<string>('app.database.username'),
        password: configService.get<string>('app.database.password'),
        database: configService.get<string>('app.database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // 生产环境设为 false
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      SatelliteTle,
      SatelliteMetadataEntity,
      User,
      Article,
    ]),
    UserModule,
    AuthModule,
    SubscriptionModule,
    PointsModule,
    SatelliteModule,
    EducationModule,
    IntelligenceModule,
    NotificationModule,
    FeedbackModule,
    SpaceWeatherModule,
    PushModule,
    MilestoneModule,
    CompanyModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
