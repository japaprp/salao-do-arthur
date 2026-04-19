import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';

describe('ProfessionalsService', () => {
  const professionalsRepository = {
    create: jest.fn(),
    findAllByTenant: jest.fn(),
    findByIdAndTenant: jest.fn(),
    findByUserIdAndTenant: jest.fn(),
    findAvailableForService: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const professionalServicesRepository = {
    findByProfessionalIdAndTenant: jest.fn(),
    sync: jest.fn(),
  };

  const usersService = {
    findByIdAndTenant: jest.fn(),
  };

  const servicesService = {
    findByIdAndTenant: jest.fn(),
  };

  let service: ProfessionalsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProfessionalsService(
      professionalsRepository as never,
      professionalServicesRepository as never,
      usersService as never,
      servicesService as never,
    );
  });

  it('syncs professional services after validating professional and tenant services', async () => {
    professionalsRepository.findByIdAndTenant.mockResolvedValue({
      id: 'professional-1',
      tenantId: 'tenant-1',
    });
    servicesService.findByIdAndTenant.mockResolvedValue({
      id: 'service-1',
      tenantId: 'tenant-1',
    });
    professionalServicesRepository.sync.mockResolvedValue([
      {
        id: 'link-1',
        professionalId: 'professional-1',
        serviceId: 'service-1',
        active: true,
      },
    ]);

    const result = await service.syncServices(
      'professional-1',
      {
        services: [
          {
            serviceId: 'service-1',
            customPrice: 120,
            customDurationMinutes: 90,
            sortOrder: 0,
          },
        ],
      },
      'tenant-1',
    );

    expect(servicesService.findByIdAndTenant).toHaveBeenCalledWith('service-1', 'tenant-1');
    expect(professionalServicesRepository.sync).toHaveBeenCalledWith(
      'professional-1',
      'tenant-1',
      [
        {
          serviceId: 'service-1',
          customPrice: 120,
          customDurationMinutes: 90,
          sortOrder: 0,
        },
      ],
    );
    expect(result).toEqual([
      {
        id: 'link-1',
        professionalId: 'professional-1',
        serviceId: 'service-1',
        active: true,
      },
    ]);
  });

  it('rejects duplicate service ids in the sync payload', async () => {
    professionalsRepository.findByIdAndTenant.mockResolvedValue({
      id: 'professional-1',
      tenantId: 'tenant-1',
    });

    await expect(
      service.syncServices(
        'professional-1',
        {
          services: [
            { serviceId: 'service-1' },
            { serviceId: 'service-1' },
          ],
        },
        'tenant-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(professionalServicesRepository.sync).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the professional does not exist in the tenant', async () => {
    professionalsRepository.findByIdAndTenant.mockResolvedValue(null);

    await expect(
      service.findServiceLinks('professional-404', 'tenant-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(professionalServicesRepository.findByProfessionalIdAndTenant).not.toHaveBeenCalled();
  });

  it('rejects creating a professional when a user is already linked', async () => {
    usersService.findByIdAndTenant.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
    });
    professionalsRepository.findByUserIdAndTenant.mockResolvedValue({
      id: 'professional-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
    });

    await expect(
      service.create({
        userId: 'user-1',
        tenantId: 'tenant-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
