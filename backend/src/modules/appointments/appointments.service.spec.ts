import { ConflictException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  const appointmentsRepository = {
    create: jest.fn(),
    findByClientAndTenant: jest.fn(),
    findByProfessionalAndDateRange: jest.fn(),
  };

  const clientsService = {
    findByUserIdAndTenant: jest.fn(),
    findByIdAndTenant: jest.fn(),
  };

  const professionalsService = {
    findByIdAndTenant: jest.fn(),
  };

  const servicesService = {
    findByIdAndTenant: jest.fn(),
  };

  let service: AppointmentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppointmentsService(
      appointmentsRepository as never,
      clientsService as never,
      professionalsService as never,
      servicesService as never,
    );
  });

  it('books an appointment for the authenticated client using service defaults', async () => {
    clientsService.findByUserIdAndTenant.mockResolvedValue({
      id: 'client-1',
    });
    professionalsService.findByIdAndTenant.mockResolvedValue({
      id: 'professional-1',
    });
    servicesService.findByIdAndTenant.mockResolvedValue({
      id: 'service-1',
      price: 180,
      durationMinutes: 75,
    });
    appointmentsRepository.findByProfessionalAndDateRange.mockResolvedValue([]);
    appointmentsRepository.create.mockResolvedValue({
      id: 'appointment-1',
      status: AppointmentStatus.SCHEDULED,
    });

    const result = await service.bookForAuthenticatedClient('user-1', 'tenant-1', {
      serviceId: 'service-1',
      professionalId: 'professional-1',
      scheduledAt: '2026-05-10T14:00:00.000Z',
      notes: 'Quero escova e finalizacao.',
    });

    expect(clientsService.findByUserIdAndTenant).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(appointmentsRepository.findByProfessionalAndDateRange).toHaveBeenCalledWith(
      'professional-1',
      new Date('2026-05-10T00:00:00'),
      new Date('2026-05-10T23:59:59.999'),
      'tenant-1',
    );
    expect(appointmentsRepository.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      clientId: 'client-1',
      professionalId: 'professional-1',
      serviceId: 'service-1',
      scheduledAt: new Date('2026-05-10T14:00:00.000Z'),
      durationMinutes: 75,
      price: 180,
      totalAmount: 180,
      notes: 'Quero escova e finalizacao.',
    });
    expect(result).toEqual({
      id: 'appointment-1',
      status: AppointmentStatus.SCHEDULED,
    });
  });

  it('rejects booking when the professional is not available', async () => {
    clientsService.findByUserIdAndTenant.mockResolvedValue({
      id: 'client-1',
    });
    professionalsService.findByIdAndTenant.mockResolvedValue({
      id: 'professional-1',
    });
    servicesService.findByIdAndTenant.mockResolvedValue({
      id: 'service-1',
      price: 180,
      durationMinutes: 75,
    });
    appointmentsRepository.findByProfessionalAndDateRange.mockResolvedValue([
      {
        id: 'appointment-seed',
        scheduledAt: new Date('2026-05-10T13:30:00.000Z'),
        durationMinutes: 90,
      },
    ]);

    await expect(
      service.bookForAuthenticatedClient('user-1', 'tenant-1', {
        serviceId: 'service-1',
        professionalId: 'professional-1',
        scheduledAt: '2026-05-10T14:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('suggests real available slots ignoring overlapping appointments', async () => {
    professionalsService.findByIdAndTenant.mockResolvedValue({
      id: 'professional-1',
    });
    servicesService.findByIdAndTenant.mockResolvedValue({
      id: 'service-1',
      durationMinutes: 60,
    });
    appointmentsRepository.findByProfessionalAndDateRange.mockResolvedValue([
      {
        id: 'appointment-1',
        scheduledAt: new Date('2036-05-12T10:00:00'),
        durationMinutes: 90,
      },
      {
        id: 'appointment-2',
        scheduledAt: new Date('2036-05-12T14:00:00'),
        durationMinutes: 60,
      },
    ]);

    const result = await service.getAvailableSlots(
      {
        serviceId: 'service-1',
        professionalId: 'professional-1',
        date: '2036-05-12',
      },
      'tenant-1',
    );

    expect(result).toContainEqual({
      startAt: '2036-05-12T09:00:00',
      endAt: '2036-05-12T10:00:00',
      label: '09:00 - 10:00',
    });
    expect(result).not.toContainEqual({
      startAt: '2036-05-12T10:00:00',
      endAt: '2036-05-12T11:00:00',
      label: '10:00 - 11:00',
    });
    expect(result).toContainEqual({
      startAt: '2036-05-12T11:30:00',
      endAt: '2036-05-12T12:30:00',
      label: '11:30 - 12:30',
    });
  });
});
