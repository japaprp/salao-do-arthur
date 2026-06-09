import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  const appointmentsRepository = {
    create: jest.fn(),
    findByIdAndTenant: jest.fn(),
    findByClientAndTenant: jest.fn(),
    findByProfessionalAndDateRange: jest.fn(),
    findTimeOffsByProfessionalAndDateRange: jest.fn(),
    createTimeOff: jest.fn(),
    findTimeOffsByTenant: jest.fn(),
    removeTimeOff: jest.fn(),
    update: jest.fn(),
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

  const notificationsService = {
    notifyUser: jest.fn(),
    scheduleAppointmentReminders: jest.fn(),
    cancelAppointmentReminders: jest.fn(),
  };

  const financeService = {
    recordAppointmentCompletion: jest.fn(),
  };

  let service: AppointmentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppointmentsService(
      appointmentsRepository as never,
      clientsService as never,
      professionalsService as never,
      servicesService as never,
      notificationsService as never,
      financeService as never,
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
    appointmentsRepository.findTimeOffsByProfessionalAndDateRange.mockResolvedValue([]);
    appointmentsRepository.create.mockResolvedValue({
      id: 'appointment-1',
      status: AppointmentStatus.SCHEDULED,
    });
    appointmentsRepository.findByIdAndTenant.mockResolvedValue({
      id: 'appointment-1',
      clientId: 'client-1',
    });
    clientsService.findByIdAndTenant.mockResolvedValue({
      id: 'client-1',
      userId: 'user-1',
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
    expect(notificationsService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: 'Agendamento criado',
      }),
    );
    expect(notificationsService.scheduleAppointmentReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        appointmentId: 'appointment-1',
      }),
    );
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
    appointmentsRepository.findTimeOffsByProfessionalAndDateRange.mockResolvedValue([]);

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
    appointmentsRepository.findTimeOffsByProfessionalAndDateRange.mockResolvedValue([
      {
        id: 'time-off-1',
        startAt: new Date('2036-05-12T12:30:00'),
        endAt: new Date('2036-05-12T13:30:00'),
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
    expect(result).not.toContainEqual({
      startAt: '2036-05-12T12:30:00',
      endAt: '2036-05-12T13:30:00',
      label: '12:30 - 13:30',
    });
  });

  it('allows the authenticated client to reschedule their own appointment', async () => {
    clientsService.findByUserIdAndTenant.mockResolvedValue({ id: 'client-1' });
    clientsService.findByIdAndTenant.mockResolvedValue({
      id: 'client-1',
      userId: 'user-1',
    });
    appointmentsRepository.findByIdAndTenant.mockResolvedValue({
      id: 'appointment-1',
      clientId: 'client-1',
      professionalId: 'professional-1',
      scheduledAt: new Date('2036-05-12T10:00:00'),
      durationMinutes: 60,
      status: AppointmentStatus.SCHEDULED,
      price: 120,
      discount: 0,
      totalAmount: 120,
    });
    appointmentsRepository.findByProfessionalAndDateRange.mockResolvedValue([]);
    appointmentsRepository.findTimeOffsByProfessionalAndDateRange.mockResolvedValue([]);
    appointmentsRepository.update.mockResolvedValue({
      id: 'appointment-1',
      scheduledAt: new Date('2036-05-12T11:00:00'),
    });

    const result = await service.rescheduleMine('user-1', 'tenant-1', 'appointment-1', {
      scheduledAt: '2036-05-12T11:00:00',
    });

    expect(appointmentsRepository.update).toHaveBeenCalledWith(
      'appointment-1',
      'tenant-1',
      expect.objectContaining({
        scheduledAt: new Date('2036-05-12T11:00:00'),
      }),
    );
    expect(result).toEqual({
      id: 'appointment-1',
      scheduledAt: new Date('2036-05-12T11:00:00'),
    });
    expect(notificationsService.scheduleAppointmentReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        appointmentId: 'appointment-1',
      }),
    );
  });

  it('blocks a client from rescheduling another client appointment', async () => {
    clientsService.findByUserIdAndTenant.mockResolvedValue({ id: 'client-1' });
    appointmentsRepository.findByIdAndTenant.mockResolvedValue({
      id: 'appointment-2',
      clientId: 'client-2',
      status: AppointmentStatus.SCHEDULED,
    });

    await expect(
      service.rescheduleMine('user-1', 'tenant-1', 'appointment-2', {
        scheduledAt: '2036-05-12T11:00:00',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the authenticated client to cancel their own appointment with policy', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2036-05-12T08:00:00'));
    clientsService.findByUserIdAndTenant.mockResolvedValue({ id: 'client-1' });
    appointmentsRepository.findByIdAndTenant.mockResolvedValue({
      id: 'appointment-1',
      clientId: 'client-1',
      scheduledAt: new Date('2036-05-12T11:00:00'),
      status: AppointmentStatus.SCHEDULED,
      totalAmount: 120,
      notes: null,
    });
    appointmentsRepository.update.mockResolvedValue({
      id: 'appointment-1',
      status: AppointmentStatus.CANCELLED,
    });

    const result = await service.cancelMine('user-1', 'tenant-1', 'appointment-1');

    expect(appointmentsRepository.update).toHaveBeenCalledWith(
      'appointment-1',
      'tenant-1',
      expect.objectContaining({
        status: AppointmentStatus.CANCELLED,
      }),
    );
    expect(result.feeApplies).toBe(false);
    expect(notificationsService.cancelAppointmentReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        appointmentId: 'appointment-1',
      }),
    );
    jest.useRealTimers();
  });

  it('creates a professional time off block after validating the professional', async () => {
    professionalsService.findByIdAndTenant.mockResolvedValue({
      id: 'professional-1',
    });
    appointmentsRepository.createTimeOff.mockResolvedValue({
      id: 'time-off-1',
      title: 'Folga',
    });

    const result = await service.createTimeOff('tenant-1', {
      professionalId: 'professional-1',
      title: 'Folga',
      reason: 'Compromisso pessoal',
      startAt: '2036-05-12T12:00:00',
      endAt: '2036-05-12T18:00:00',
    });

    expect(professionalsService.findByIdAndTenant).toHaveBeenCalledWith(
      'professional-1',
      'tenant-1',
    );
    expect(appointmentsRepository.createTimeOff).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      professionalId: 'professional-1',
      title: 'Folga',
      reason: 'Compromisso pessoal',
      startAt: new Date('2036-05-12T12:00:00'),
      endAt: new Date('2036-05-12T18:00:00'),
    });
    expect(result).toEqual({
      id: 'time-off-1',
      title: 'Folga',
    });
  });
});
