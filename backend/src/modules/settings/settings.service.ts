import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SalonSettings } from '@prisma/client';
import { toPrismaJson } from '../../common/utils/prisma-json.util';
import { TenantsService } from '../tenants/tenants.service';
import { UpdateSalonSettingsDto } from './dto/update-salon-settings.dto';
import { SettingsRepository } from './repositories/settings.repository';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly tenantsService: TenantsService,
  ) {}

  async getByTenantId(tenantId: string): Promise<SalonSettings> {
    const existing = await this.settingsRepository.findByTenantId(tenantId);
    if (existing) {
      return existing;
    }

    const tenant = await this.tenantsService.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado.');
    }

    return this.settingsRepository.createDefaults({
      tenantId,
      salonName: tenant.name,
      locale: tenant.locale,
    });
  }

  async updateByTenantId(
    tenantId: string,
    updateSalonSettingsDto: UpdateSalonSettingsDto,
  ): Promise<SalonSettings> {
    await this.getByTenantId(tenantId);

    const payload: Prisma.SalonSettingsUpdateInput = {};

    if (updateSalonSettingsDto.salonName !== undefined) payload.salonName = updateSalonSettingsDto.salonName;
    if (updateSalonSettingsDto.legalName !== undefined) payload.legalName = updateSalonSettingsDto.legalName;
    if (updateSalonSettingsDto.description !== undefined)
      payload.description = updateSalonSettingsDto.description;
    if (updateSalonSettingsDto.phone !== undefined) payload.phone = updateSalonSettingsDto.phone;
    if (updateSalonSettingsDto.whatsapp !== undefined) payload.whatsapp = updateSalonSettingsDto.whatsapp;
    if (updateSalonSettingsDto.email !== undefined) payload.email = updateSalonSettingsDto.email;
    if (updateSalonSettingsDto.timezone !== undefined) payload.timezone = updateSalonSettingsDto.timezone;
    if (updateSalonSettingsDto.currency !== undefined) payload.currency = updateSalonSettingsDto.currency;
    if (updateSalonSettingsDto.locale !== undefined) payload.locale = updateSalonSettingsDto.locale;
    if (updateSalonSettingsDto.appointmentLeadTimeMinutes !== undefined) {
      payload.appointmentLeadTimeMinutes = updateSalonSettingsDto.appointmentLeadTimeMinutes;
    }
    if (updateSalonSettingsDto.cancellationWindowHours !== undefined) {
      payload.cancellationWindowHours = updateSalonSettingsDto.cancellationWindowHours;
    }
    if (updateSalonSettingsDto.reminderLeadHours) {
      payload.reminderLeadHours = toPrismaJson(updateSalonSettingsDto.reminderLeadHours);
    }
    if (updateSalonSettingsDto.allowWaitlist !== undefined) {
      payload.allowWaitlist = updateSalonSettingsDto.allowWaitlist;
    }
    if (updateSalonSettingsDto.enableCheckout !== undefined) {
      payload.enableCheckout = updateSalonSettingsDto.enableCheckout;
    }
    if (updateSalonSettingsDto.enableLoyalty !== undefined) {
      payload.enableLoyalty = updateSalonSettingsDto.enableLoyalty;
    }
    if (updateSalonSettingsDto.enableCashback !== undefined) {
      payload.enableCashback = updateSalonSettingsDto.enableCashback;
    }
    if (updateSalonSettingsDto.enableReferrals !== undefined) {
      payload.enableReferrals = updateSalonSettingsDto.enableReferrals;
    }
    if (updateSalonSettingsDto.enableProductCatalog !== undefined) {
      payload.enableProductCatalog = updateSalonSettingsDto.enableProductCatalog;
    }
    if (updateSalonSettingsDto.primaryColor !== undefined) {
      payload.primaryColor = updateSalonSettingsDto.primaryColor;
    }
    if (updateSalonSettingsDto.secondaryColor !== undefined) {
      payload.secondaryColor = updateSalonSettingsDto.secondaryColor;
    }
    if (updateSalonSettingsDto.accentColor !== undefined) {
      payload.accentColor = updateSalonSettingsDto.accentColor;
    }
    if (updateSalonSettingsDto.instagram !== undefined) payload.instagram = updateSalonSettingsDto.instagram;
    if (updateSalonSettingsDto.facebook !== undefined) payload.facebook = updateSalonSettingsDto.facebook;
    if (updateSalonSettingsDto.tiktok !== undefined) payload.tiktok = updateSalonSettingsDto.tiktok;
    if (updateSalonSettingsDto.privacyPolicyUrl !== undefined) {
      payload.privacyPolicyUrl = updateSalonSettingsDto.privacyPolicyUrl;
    }

    return this.settingsRepository.update(tenantId, payload);
  }
}
