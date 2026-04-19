import { AppointmentStatus } from '@prisma/client';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const transaction = {
    appointment: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    client: {
      count: jest.fn(),
    },
  };

  const prismaService = {
    withTenant: jest.fn(async (_tenantId: string, callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };

  let service: ReportsService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-18T12:00:00.000Z'));
    jest.clearAllMocks();

    transaction.appointment.count.mockImplementation(({ where }: { where: any }) => {
      if (Array.isArray(where.status?.in)) {
        return Promise.resolve(3);
      }

      if (where.status === AppointmentStatus.COMPLETED && where.scheduledAt) {
        return Promise.resolve(5);
      }

      if (where.status === AppointmentStatus.COMPLETED) {
        return Promise.resolve(12);
      }

      return Promise.resolve(0);
    });

    transaction.appointment.aggregate.mockImplementation(({ where }: { where: any }) => {
      if (Array.isArray(where.status?.in)) {
        return Promise.resolve({
          _sum: {
            totalAmount: 540,
          },
        });
      }

      if (where.status === AppointmentStatus.COMPLETED && where.scheduledAt) {
        return Promise.resolve({
          _sum: {
            totalAmount: 980,
          },
        });
      }

      if (where.status === AppointmentStatus.COMPLETED) {
        return Promise.resolve({
          _sum: {
            totalAmount: 3400,
          },
        });
      }

      return Promise.resolve({
        _sum: {
          totalAmount: 0,
        },
      });
    });

    transaction.client.count.mockImplementation(({ where }: { where: any }) => {
      if (where.createdAt) {
        return Promise.resolve(4);
      }

      return Promise.resolve(27);
    });

    transaction.appointment.findMany.mockImplementation(({ where, include, select }: { where: any; include?: any; select?: any }) => {
      if (include?.client && Array.isArray(where.status?.in)) {
        return Promise.resolve([
          {
            id: 'appointment-1',
            clientId: 'client-1',
            professionalId: 'professional-1',
            serviceId: 'service-1',
            scheduledAt: new Date('2026-04-18T15:00:00.000Z'),
            durationMinutes: 60,
            status: AppointmentStatus.SCHEDULED,
            price: 120,
            discount: 0,
            totalAmount: 120,
            tenantId: 'tenant-1',
            createdAt: new Date('2026-04-10T12:00:00.000Z'),
            updatedAt: new Date('2026-04-10T12:00:00.000Z'),
            client: { user: { name: 'Maria' } },
            professional: { user: { name: 'Ana' } },
            service: { name: 'Corte', price: 120, durationMinutes: 60 },
          },
        ]);
      }

      if (select?.scheduledAt) {
        return Promise.resolve([
          { scheduledAt: new Date('2026-01-15T12:00:00.000Z'), totalAmount: 300 },
          { scheduledAt: new Date('2026-03-10T12:00:00.000Z'), totalAmount: 420 },
          { scheduledAt: new Date('2026-04-05T12:00:00.000Z'), totalAmount: 560 },
          { scheduledAt: new Date('2026-04-16T12:00:00.000Z'), totalAmount: 420 },
        ]);
      }

      return Promise.resolve([
        {
          serviceId: 'service-1',
          totalAmount: 200,
          service: { name: 'Corte' },
          professionalId: 'professional-1',
          professional: { user: { name: 'Ana' } },
        },
        {
          serviceId: 'service-1',
          totalAmount: 220,
          service: { name: 'Corte' },
          professionalId: 'professional-1',
          professional: { user: { name: 'Ana' } },
        },
        {
          serviceId: 'service-2',
          totalAmount: 180,
          service: { name: 'Escova' },
          professionalId: 'professional-2',
          professional: { user: { name: 'Clara' } },
        },
      ]);
    });

    service = new ReportsService(prismaService as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns consolidated overview metrics from real backend queries', async () => {
    const result = await service.getOverview('tenant-1');

    expect(prismaService.withTenant).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(result.summary).toEqual({
      activeAppointments: 3,
      projectedRevenue: 540,
      totalClients: 27,
      newClients: 4,
      totalCompletedAppointments: 12,
      monthlyCompletedAppointments: 5,
      totalRevenue: 3400,
      monthlyRevenue: 980,
      averageTicket: 196,
    });
    expect(result.monthlyData).toEqual([
      { monthKey: '2026-01', label: 'Jan', revenue: 300, appointments: 1 },
      { monthKey: '2026-02', label: 'Fev', revenue: 0, appointments: 0 },
      { monthKey: '2026-03', label: 'Mar', revenue: 420, appointments: 1 },
      { monthKey: '2026-04', label: 'Abr', revenue: 980, appointments: 2 },
    ]);
    expect(result.topService).toEqual({
      serviceId: 'service-1',
      name: 'Corte',
      count: 2,
      percentage: 67,
      revenue: 420,
    });
    expect(result.professionalPerformance[0]).toEqual({
      professionalId: 'professional-1',
      name: 'Ana',
      appointments: 2,
      revenue: 420,
    });
    expect(result.upcomingAppointments).toHaveLength(1);
  });
});
