import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockedBcrypt = jest.mocked(bcrypt);

describe('AuthService', () => {
  const fixedDate = new Date('2026-04-14T12:00:00.000Z');

  const usersService = {
    findByEmailAndTenant: jest.fn(),
    findByIdAndTenant: jest.fn(),
    findById: jest.fn(),
  };

  const tenantsService = {
    findById: jest.fn(),
    findBySubdomain: jest.fn(),
    createTenant: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const prismaService = {
    withTenant: jest.fn(),
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const configValues: Record<string, string> = {
    JWT_EXPIRES_IN: '1h',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    REFRESH_TOKEN_SECRET: 'refresh-secret-for-tests',
  };

  const configService = {
    get: jest.fn((key: string, fallback?: string | number) => configValues[key] ?? fallback),
  } as unknown as ConfigService;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersService as never,
      tenantsService as never,
      jwtService as never,
      configService,
      prismaService as never,
    );
  });

  it('returns access token and refresh token on successful login', async () => {
    tenantsService.findBySubdomain.mockResolvedValue({
      id: 'tenant-1',
      subdomain: 'salao-da-lu',
    });
    usersService.findByEmailAndTenant.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@salao.com',
      passwordHash: 'hashed-password',
      name: 'Cliente Demo',
      role: UserRole.CLIENT,
      tenantId: 'tenant-1',
      phone: null,
      isActive: true,
      createdAt: fixedDate,
      updatedAt: fixedDate,
      deletedAt: null,
    });
    jwtService.sign
      .mockReturnValueOnce('signed-access-token')
      .mockReturnValueOnce('signed-refresh-token');
    prismaService.refreshToken.create.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      token: 'signed-refresh-token',
      expiresAt: new Date('2026-04-21T12:00:00.000Z'),
      revokedAt: null,
      createdAt: fixedDate,
    });
    mockedBcrypt.compare.mockResolvedValue(true as never);

    const result = await service.login({
      tenantSubdomain: 'Salao da Lu',
      email: 'cliente@salao.com',
      password: 'senha-segura',
    });

    expect(result).toEqual({
      accessToken: 'signed-access-token',
      refreshToken: 'signed-refresh-token',
      tokenType: 'Bearer',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      user: {
        id: 'user-1',
        email: 'cliente@salao.com',
        name: 'Cliente Demo',
        role: UserRole.CLIENT,
        tenantId: 'tenant-1',
        phone: null,
        isActive: true,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        deletedAt: null,
      },
    });
    expect(tenantsService.findBySubdomain).toHaveBeenCalledWith('salao-da-lu');
    expect(usersService.findByEmailAndTenant).toHaveBeenCalledWith('cliente@salao.com', 'tenant-1');
    expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        token: 'signed-refresh-token',
      }),
    });
  });

  it('throws UnauthorizedException when password is invalid', async () => {
    tenantsService.findBySubdomain.mockResolvedValue({
      id: 'tenant-1',
      subdomain: 'salao-da-lu',
    });
    usersService.findByEmailAndTenant.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@salao.com',
      passwordHash: 'hashed-password',
      name: 'Cliente Demo',
      role: UserRole.CLIENT,
      tenantId: 'tenant-1',
      phone: null,
      createdAt: fixedDate,
      updatedAt: fixedDate,
      deletedAt: null,
    });
    mockedBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      service.login({
        tenantSubdomain: 'salao-da-lu',
        email: 'cliente@salao.com',
        password: 'senha-incorreta',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('registers a client against an existing tenant subdomain and creates the client profile', async () => {
    tenantsService.findBySubdomain.mockResolvedValue({
      id: 'tenant-1',
      subdomain: 'salao-da-lu',
    });
    const transaction = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'cliente@salao.com',
          passwordHash: 'hashed-password',
          name: 'Cliente Premium',
          role: UserRole.CLIENT,
          tenantId: 'tenant-1',
        }),
      },
      client: {
        create: jest.fn().mockResolvedValue({
          id: 'client-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
        }),
      },
      adminProfile: {
        create: jest.fn(),
      },
    };
    prismaService.withTenant.mockImplementation(async (_tenantId, callback) =>
      callback(transaction),
    );
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

    const result = await service.register({
      email: 'cliente@salao.com',
      password: 'senha-segura',
      name: 'Cliente Premium',
      tenantSubdomain: 'Salao da Lu',
    });

    expect(tenantsService.findBySubdomain).toHaveBeenCalledWith('salao-da-lu');
    expect(prismaService.withTenant).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(transaction.user.create).toHaveBeenCalledWith({
      data: {
        email: 'cliente@salao.com',
        phone: undefined,
        passwordHash: 'hashed-password',
        name: 'Cliente Premium',
        role: UserRole.CLIENT,
        tenantId: 'tenant-1',
      },
    });
    expect(transaction.client.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tenantId: 'tenant-1',
      },
    });
    expect(transaction.adminProfile.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: 'user-1',
      email: 'cliente@salao.com',
      name: 'Cliente Premium',
      role: UserRole.CLIENT,
      tenantId: 'tenant-1',
    });
  });

  it('registers a manager for a newly created tenant and authenticates the onboarding flow', async () => {
    tenantsService.createTenant.mockResolvedValue({ id: 'tenant-new' });
    const transaction = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'dona@salao.com',
          passwordHash: 'hashed-password',
          name: 'Dona do Salão',
          role: UserRole.MANAGER,
          tenantId: 'tenant-new',
          phone: null,
          isActive: true,
          createdAt: fixedDate,
          updatedAt: fixedDate,
          deletedAt: null,
        }),
      },
      client: {
        create: jest.fn(),
      },
      adminProfile: {
        create: jest.fn().mockResolvedValue({
          id: 'admin-profile-1',
          userId: 'user-1',
          tenantId: 'tenant-new',
        }),
      },
    };
    prismaService.withTenant.mockImplementation(async (_tenantId, callback) =>
      callback(transaction),
    );
    prismaService.refreshToken.create.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      token: 'signed-refresh-token',
      expiresAt: new Date('2026-04-21T12:00:00.000Z'),
      revokedAt: null,
      createdAt: fixedDate,
    });
    jwtService.sign
      .mockReturnValueOnce('signed-access-token')
      .mockReturnValueOnce('signed-refresh-token');
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

    const result = await service.registerAdmin({
      email: 'dona@salao.com',
      password: 'senha-segura',
      name: 'Dona do Salão',
      organizationName: 'Salão da Lú Premium',
      locale: 'pt-BR',
    });

    expect(tenantsService.createTenant).toHaveBeenCalledWith({
      name: 'Salão da Lú Premium',
      subdomain: 'salao-da-lu-premium',
      locale: 'pt-BR',
    });
    expect(transaction.user.create).toHaveBeenCalledWith({
      data: {
        email: 'dona@salao.com',
        phone: undefined,
        passwordHash: 'hashed-password',
        name: 'Dona do Salão',
        role: UserRole.MANAGER,
        tenantId: 'tenant-new',
      },
    });
    expect(transaction.client.create).not.toHaveBeenCalled();
    expect(transaction.adminProfile.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tenantId: 'tenant-new',
      },
    });
    expect(result).toEqual({
      accessToken: 'signed-access-token',
      refreshToken: 'signed-refresh-token',
      tokenType: 'Bearer',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      user: {
        id: 'user-1',
        email: 'dona@salao.com',
        name: 'Dona do Salão',
        role: UserRole.MANAGER,
        tenantId: 'tenant-new',
        phone: null,
        isActive: true,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        deletedAt: null,
      },
    });
  });

  it('supports legacy register flow with tenantId when informed', async () => {
    tenantsService.findById.mockResolvedValue({ id: 'tenant-1' });
    const transaction = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'cliente@salao.com',
          passwordHash: 'hashed-password',
          name: 'Cliente Premium',
          role: UserRole.CLIENT,
          tenantId: 'tenant-1',
        }),
      },
      client: {
        create: jest.fn().mockResolvedValue({
          id: 'client-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
        }),
      },
      adminProfile: {
        create: jest.fn(),
      },
    };
    prismaService.withTenant.mockImplementation(async (_tenantId, callback) =>
      callback(transaction),
    );
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

    const result = await service.register({
      email: 'cliente@salao.com',
      password: 'senha-segura',
      name: 'Cliente Premium',
      tenantId: 'tenant-1',
    });

    expect(tenantsService.findById).toHaveBeenCalledWith('tenant-1');
    expect(result).toEqual({
      id: 'user-1',
      email: 'cliente@salao.com',
      name: 'Cliente Premium',
      role: UserRole.CLIENT,
      tenantId: 'tenant-1',
    });
  });

  it('rejects registration when tenant resolution data is missing', async () => {
    await expect(
      service.register({
        email: 'cliente@salao.com',
        password: 'senha-segura',
        name: 'Cliente Premium',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects registration when the email already exists', async () => {
    tenantsService.findBySubdomain.mockResolvedValue({
      id: 'tenant-1',
      subdomain: 'salao-da-lu',
    });
    prismaService.withTenant.mockRejectedValue({
      code: 'P2002',
      name: 'PrismaClientKnownRequestError',
    });
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

    await expect(
      service.register({
        tenantSubdomain: 'salao-da-lu',
        email: 'cliente@salao.com',
        password: 'senha-segura',
        name: 'Cliente Premium',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
