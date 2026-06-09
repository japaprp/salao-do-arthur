import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { ProductsModule } from './modules/products/products.module';
import { StoreModule } from './modules/store/store.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { BannersModule } from './modules/banners/banners.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { validate } from './common/config/env.validation';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requisições por minuto
      },
    ]),
    PrismaModule,
    UsersModule,
    TenantsModule,
    AuthModule,
    ProfessionalsModule,
    ClientsModule,
    SettingsModule,
    ServiceCategoriesModule,
    ServicesModule,
    ProductCategoriesModule,
    ProductsModule,
    PaymentsModule,
    LoyaltyModule,
    FinanceModule,
    StoreModule,
    PromotionsModule,
    CouponsModule,
    BannersModule,
    ReportsModule,
    NotificationsModule,
    AppointmentsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
