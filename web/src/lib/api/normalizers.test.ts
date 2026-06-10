import {
  normalizeClient,
  normalizeReportsOverview,
} from '@/lib/api/normalizers';

describe('api normalizers', () => {
  it('normalizes client loyalty wallet fields used by the admin panel', () => {
    const client = normalizeClient({
      id: 'client-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      loyaltyPoints: '720',
      loyaltyLevel: 'SILVER',
      lifetimeValue: '1250.50',
      loyaltyWallet: {
        id: 'wallet-1',
        pointsBalance: '320',
        cashbackBalance: '42.75',
        currentLevel: 'SILVER',
      },
      createdAt: '2026-06-01T12:00:00.000Z',
      updatedAt: '2026-06-02T12:00:00.000Z',
    });

    expect(client.loyaltyPoints).toBe(720);
    expect(client.lifetimeValue).toBe(1250.5);
    expect(client.loyaltyWallet).toEqual({
      id: 'wallet-1',
      pointsBalance: 320,
      cashbackBalance: 42.75,
      currentLevel: 'SILVER',
    });
  });

  it('normalizes reports overview with phase 9 metrics', () => {
    const overview = normalizeReportsOverview({
      summary: {
        totalRevenue: '3400',
        monthlyRevenue: '980',
        averageTicket: '196',
        returnRate: '50',
      },
      topProducts: [
        {
          productId: 'product-1',
          name: 'Pomada modeladora',
          quantity: '3',
          revenue: '150',
        },
      ],
      recurringClients: [
        {
          clientId: 'client-1',
          name: 'Maria',
          appointments: '2',
          revenue: '420',
        },
      ],
    });

    expect(overview.summary.returnRate).toBe(50);
    expect(overview.topProducts[0]).toEqual({
      productId: 'product-1',
      name: 'Pomada modeladora',
      quantity: 3,
      revenue: 150,
    });
    expect(overview.recurringClients[0]).toEqual({
      clientId: 'client-1',
      name: 'Maria',
      appointments: 2,
      revenue: 420,
    });
  });
});
