import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { MercadoPagoCheckoutProvider } from './mercado-pago.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [ConfigModule, PrismaModule, AuditModule, LoyaltyModule],
  controllers: [PaymentsController],
  providers: [MercadoPagoCheckoutProvider, PaymentsService],
  exports: [MercadoPagoCheckoutProvider, PaymentsService],
})
export class PaymentsModule {}
