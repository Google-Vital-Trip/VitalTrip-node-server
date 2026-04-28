import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { FirstAidModule } from './first-aid/first-aid.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UserModule } from './user/user.module';
import { LocationModule } from './location/location.module';
import { AdminModule } from './admin/admin.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    FirstAidModule,
    AuthModule,
    UsersModule,
    UserModule,
    LocationModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
