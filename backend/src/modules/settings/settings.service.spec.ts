import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  const settingsRepository = {
    findByTenantId: jest.fn(),
    createDefaults: jest.fn(),
    update: jest.fn(),
  };
  const tenantsService = {
    findById: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    settingsRepository.findByTenantId.mockResolvedValue({
      tenantId: 'tenant-1',
      salonName: 'Barbearia do Artur',
    });
  });

  it('does not enable checkout when Mercado Pago is not configured', async () => {
    configService.get.mockReturnValue(undefined);
    const service = new SettingsService(
      settingsRepository as never,
      tenantsService as never,
      configService as unknown as ConfigService,
    );

    await expect(service.updateByTenantId('tenant-1', {
      enableCheckout: true,
    })).rejects.toBeInstanceOf(BadRequestException);

    expect(settingsRepository.update).not.toHaveBeenCalled();
  });

  it('allows checkout activation only with provider credentials and an HTTPS webhook', async () => {
    const providerConfig: Record<string, string> = {
      MERCADO_PAGO_ACCESS_TOKEN: 'sandbox-access-token',
      MERCADO_PAGO_WEBHOOK_SECRET: 'sandbox-webhook-secret',
      MERCADO_PAGO_WEBHOOK_URL: 'https://api.example.test/api/payments/webhooks/mercado-pago',
    };
    configService.get.mockImplementation((key: string) => providerConfig[key]);
    settingsRepository.update.mockResolvedValue({ tenantId: 'tenant-1', enableCheckout: true });
    const service = new SettingsService(
      settingsRepository as never,
      tenantsService as never,
      configService as unknown as ConfigService,
    );

    await service.updateByTenantId('tenant-1', { enableCheckout: true });

    expect(settingsRepository.update).toHaveBeenCalledWith('tenant-1', {
      enableCheckout: true,
    });
  });
});
