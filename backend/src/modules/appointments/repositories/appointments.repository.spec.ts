import { NotFoundException } from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';

describe('AppointmentsRepository tenant isolation', () => {
  const transaction = {
    timeOff: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const prisma = {
    withTenant: jest.fn((_tenantId: string, operation: (client: typeof transaction) => unknown) =>
      operation(transaction),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not delete a time-off record owned by another tenant', async () => {
    transaction.timeOff.findFirst.mockResolvedValue(null);
    const repository = new AppointmentsRepository(prisma as never);

    await expect(repository.removeTimeOff('timeoff-other-tenant', 'tenant-1'))
      .rejects.toBeInstanceOf(NotFoundException);

    expect(transaction.timeOff.findFirst).toHaveBeenCalledWith({
      where: { id: 'timeoff-other-tenant', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true },
    });
    expect(transaction.timeOff.update).not.toHaveBeenCalled();
  });

  it('deletes a time-off record only after tenant ownership is confirmed', async () => {
    transaction.timeOff.findFirst.mockResolvedValue({ id: 'timeoff-1' });
    transaction.timeOff.update.mockResolvedValue({ id: 'timeoff-1' });
    const repository = new AppointmentsRepository(prisma as never);

    await repository.removeTimeOff('timeoff-1', 'tenant-1');

    const updateCalls = transaction.timeOff.update.mock.calls as unknown as Array<[
      { where: { id: string }; data: { deletedAt: Date } },
    ]>;
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0][0].where).toEqual({ id: 'timeoff-1' });
    expect(updateCalls[0][0].data.deletedAt).toBeInstanceOf(Date);
  });
});
