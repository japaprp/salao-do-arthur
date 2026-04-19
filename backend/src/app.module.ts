import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { BannersModule } from './modules/banners/banners.module';
import { ReportsModule } from './modules/reports/reports.module';
import { validate } from './common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
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
    PromotionsModule,
    CouponsModule,
    BannersModule,
    ReportsModule,
    AppointmentsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
