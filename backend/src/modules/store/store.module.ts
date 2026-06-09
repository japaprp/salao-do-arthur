import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';
import { PaymentsModule } from '../payments/payments.module';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';

@Module({
  imports: [PrismaModule, ClientsModule, PaymentsModule],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
