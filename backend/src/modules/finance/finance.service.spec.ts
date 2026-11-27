import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  const transaction = {
    appointment: {
      aggregate: jest.fn().mockResolvedValue({
        _sum: { totalAmount: 100 },
        _count: { id: 1 },
      }),
    },
    order: {
      aggregate: jest.fn().mockResolvedValue({
        _sum: { totalAmount: 0 },
        _count: { id: 0 },
      }),
    },
    transaction: {
      aggregate: jest.fn()
        .mockResolvedValueOnce({ _sum: { amount: 50 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 }, _count: { id: 0 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    commission: {
      aggregate: jest.fn().mockResolvedValue({
        _sum: { amount: 0 },
        _count: { id: 0 },
      }),
    },
  };

  const prisma = {
    withTenant: jest.fn((_tenantId: string, operation: (client: typeof transaction) => unknown) =>
      operation(transaction),
    ),
  };
  const auditService = { record: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.appointment.aggregate.mockResolvedValue({
      _sum: { totalAmount: 100 },
      _count: { id: 1 },
    });
    transaction.order.aggregate.mockResolvedValue({
      _sum: { totalAmount: 0 },
      _count: { id: 0 },
    });
    transaction.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 50 } })
      .mockResolvedValueOnce({ _sum: { amount: 0 }, _count: { id: 0 } });
    transaction.commission.aggregate.mockResolvedValue({
      _sum: { amount: 0 },
      _count: { id: 0 },
    });
    transaction.transaction.findMany.mockResolvedValue([]);
  });

  it('writes appointment revenue and commission with duplicate-safe inserts', async () => {
    transaction.appointment.findFirst = jest.fn().mockResolvedValue({
      id: 'appointment-1',
      tenantId: 'tenant-1',
      totalAmount: 100,
      finishedAt: new Date('2026-11-27T12:00:00.000Z'),
      professional: { commissionPercent: 40 },
    });
    transaction.commission.createMany = jest.fn().mockResolvedValue({ count: 1 });
    transaction.transaction.createMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = new FinanceService(prisma as never, auditService as never);

    await service.recordAppointmentCompletion('tenant-1', 'appointment-1');

    expect(transaction.commission.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(transaction.transaction.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });

  it('excludes appointment-linked income from the manual income total', async () => {
    const service = new FinanceService(prisma as never, auditService as never);

    const result = await service.getOverview('tenant-1', 'monthly');

    expect(transaction.transaction.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          appointmentId: null,
          type: 'INCOME',
          status: 'CONFIRMED',
        }),
      }),
    );
    expect(result.summary.revenue).toBe(150);
  });
});
