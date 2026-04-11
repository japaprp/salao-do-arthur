import { Module } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsRepository } from './repositories/professionals.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, ProfessionalsRepository],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
