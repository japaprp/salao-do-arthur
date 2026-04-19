import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingsRepository } from './repositories/settings.repository';

@Module({
  imports: [TenantsModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsService],
})
export class SettingsModule {}
