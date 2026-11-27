import { PrismaService } from './prisma.service';

type QueryArgs = Record<string, unknown>;
type QueryHook = (input: {
  model: string;
  operation: string;
  args: QueryArgs;
  query: (args: QueryArgs) => Promise<unknown>;
}) => Promise<unknown>;

function createServiceHarness() {
  const service = Object.create(PrismaService.prototype) as PrismaService;
  let hook: QueryHook;
  const fakeTransaction = {
    user: {
      findMany: jest.fn((args: QueryArgs) =>
        hook({
          model: 'User',
          operation: 'findMany',
          args,
          query: async scopedArgs => scopedArgs,
        }),
      ),
      create: jest.fn((args: QueryArgs) =>
        hook({
          model: 'User',
          operation: 'create',
          args,
          query: async scopedArgs => scopedArgs,
        }),
      ),
    },
  };
  const extendedClient = {
    $transaction: jest.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback(fakeTransaction),
    ),
  };

  Object.defineProperty(service, '$extends', {
    configurable: true,
    value: jest.fn((configuration: unknown) => {
      const config = configuration as {
        query: { $allModels: { $allOperations: QueryHook } };
      };
      hook = config.query.$allModels.$allOperations;
      return extendedClient;
    }),
  });

  return { service, fakeTransaction, extendedClient };
}

describe('PrismaService.withTenant', () => {
  it('automatically scopes reads to the active tenant', async () => {
    const { service, fakeTransaction } = createServiceHarness();

    const result = await service.withTenant('tenant-1', client =>
      client.user.findMany({ where: { active: true } }) as unknown as Promise<unknown>,
    );

    expect(result).toEqual({ where: { active: true, tenantId: 'tenant-1' } });
    expect(fakeTransaction.user.findMany).toHaveBeenCalled();
  });

  it('rejects attempts to query another tenant', async () => {
    const { service, fakeTransaction } = createServiceHarness();

    await expect(service.withTenant('tenant-1', client =>
      client.user.findMany({ where: { tenantId: 'tenant-2' } }) as unknown as Promise<unknown>,
    )).rejects.toThrow('Tenant context mismatch');

    expect(fakeTransaction.user.findMany).toHaveBeenCalled();
  });

  it('injects the tenant into create operations', async () => {
    const { service, fakeTransaction } = createServiceHarness();

    const result = await service.withTenant('tenant-1', client =>
      client.user.create({ data: { email: 'client@example.test' } }) as unknown as Promise<unknown>,
    );

    expect(result).toEqual({
      data: { email: 'client@example.test', tenantId: 'tenant-1' },
    });
    expect(fakeTransaction.user.create).toHaveBeenCalled();
  });

  it('rejects transactions without a tenant context', async () => {
    const { service, extendedClient } = createServiceHarness();

    await expect(service.withTenant(' ', async () => undefined)).rejects.toThrow(
      'Tenant context is required',
    );
    expect(extendedClient.$transaction).not.toHaveBeenCalled();
  });
});
