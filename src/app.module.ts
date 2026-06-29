import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { PrismaModule } from './prisma/prisma.module';
import { FirstAidModule } from './first-aid/first-aid.module';
import { EncyclopediaModule } from './encyclopedia/encyclopedia.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UserModule } from './user/user.module';
import { LocationModule } from './location/location.module';
import { AdminModule } from './admin/admin.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    FirstAidModule,
    EncyclopediaModule,
    AuthModule,
    UsersModule,
    UserModule,
    LocationModule,
    AdminModule,
  ],
  providers: [
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP 요청 처리 시간 (초)',
      labelNames: ['method', 'route', 'statusCode'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    }),
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'HTTP 요청 총 수',
      labelNames: ['method', 'route', 'statusCode'],
    }),
    MetricsInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: MetricsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
