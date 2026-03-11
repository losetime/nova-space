import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
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
        synchronize: true, // 生产环境设为 false
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    SubscriptionModule,
    PointsModule,
    SatelliteModule,
    EducationModule,
    IntelligenceModule,
    NotificationModule,
    FeedbackModule,
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