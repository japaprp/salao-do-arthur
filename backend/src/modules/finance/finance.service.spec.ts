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
