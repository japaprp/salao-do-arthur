import { Module } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsRepository } from './repositories/professionals.repository';
import { ProfessionalServicesRepository } from './repositories/professional-services.repository';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [UsersModule, ServicesModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, ProfessionalsRepository, ProfessionalServicesRepository],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
