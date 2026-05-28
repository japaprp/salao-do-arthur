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
    updatePassword: jest.fn(),
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
    NODE_ENV: 'development',
    JWT_EXPIRES_IN: '1h',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    REFRESH_TOKEN_SECRET: 'refresh-secret-for-tests',
    PASSWORD_RESET_SECRET: 'password-reset-secret-for-tests',
    WEB_APP_URL: 'http://localhost:3001',
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
      subdomain: 'barbearia-do-artur',
    });
    usersService.findByEmailAndTenant.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@barbeariadoartur.app',
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
      tenantSubdomain: 'Barbearia do Artur',
      email: 'cliente@barbeariadoartur.app',
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
        email: 'cliente@barbeariadoartur.app',
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
    expect(tenantsService.findBySubdomain).toHaveBeenCalledWith('barbearia-do-artur');
    expect(usersService.findByEmailAndTenant).toHaveBeenCalledWith('cliente@barbeariadoartur.app', 'tenant-1');
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
      subdomain: 'barbearia-do-artur',
    });
    usersService.findByEmailAndTenant.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@barbeariadoartur.app',
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
        tenantSubdomain: 'barbearia-do-artur',
        email: 'cliente@barbeariadoartur.app',
        password: 'senha-incorreta',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('registers a client against an existing tenant subdomain and creates the client profile', async () => {
    tenantsService.findBySubdomain.mockResolvedValue({
      id: 'tenant-1',
      subdomain: 'barbearia-do-artur',
    });
    const transaction = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'cliente@barbeariadoartur.app',
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
      email: 'cliente@barbeariadoartur.app',
      password: 'senha-segura',
      name: 'Cliente Premium',
      tenantSubdomain: 'Barbearia do Artur',
    });

    expect(tenantsService.findBySubdomain).toHaveBeenCalledWith('barbearia-do-artur');
    expect(prismaService.withTenant).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(transaction.user.create).toHaveBeenCalledWith({
      data: {
        email: 'cliente@barbeariadoartur.app',
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
      email: 'cliente@barbeariadoartur.app',
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
          email: 'artur@barbeariadoartur.app',
          passwordHash: 'hashed-password',
          name: 'Artur',
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
      email: 'artur@barbeariadoartur.app',
      password: 'senha-segura',
      name: 'Artur',
      organizationName: 'Barbearia do Artur Premium',
      locale: 'pt-BR',
    });

    expect(tenantsService.createTenant).toHaveBeenCalledWith({
      name: 'Barbearia do Artur Premium',
      subdomain: 'barbearia-do-artur-premium',
      locale: 'pt-BR',
    });
    expect(transaction.user.create).toHaveBeenCalledWith({
      data: {
        email: 'artur@barbeariadoartur.app',
        phone: undefined,
        passwordHash: 'hashed-password',
        name: 'Artur',
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
        email: 'artur@barbeariadoartur.app',
        name: 'Artur',
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
          email: 'cliente@barbeariadoartur.app',
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
      email: 'cliente@barbeariadoartur.app',
      password: 'senha-segura',
      name: 'Cliente Premium',
      tenantId: 'tenant-1',
    });

    expect(tenantsService.findById).toHaveBeenCalledWith('tenant-1');
    expect(result).toEqual({
      id: 'user-1',
      email: 'cliente@barbeariadoartur.app',
      name: 'Cliente Premium',
      role: UserRole.CLIENT,
      tenantId: 'tenant-1',
    });
  });

  it('rejects registration when tenant resolution data is missing', async () => {
    await expect(
      service.register({
        email: 'cliente@barbeariadoartur.app',
        password: 'senha-segura',
        name: 'Cliente Premium',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects registration when the email already exists', async () => {
    tenantsService.findBySubdomain.mockResolvedValue({
      id: 'tenant-1',
      subdomain: 'barbearia-do-artur',
    });
    prismaService.withTenant.mockRejectedValue({
      code: 'P2002',
      name: 'PrismaClientKnownRequestError',
    });
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

    await expect(
      service.register({
        tenantSubdomain: 'barbearia-do-artur',
        email: 'cliente@barbeariadoartur.app',
        password: 'senha-segura',
        name: 'Cliente Premium',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a password reset link in development without exposing whether the email exists', async () => {
    tenantsService.findBySubdomain.mockResolvedValue({
      id: 'tenant-1',
      subdomain: 'barbearia-do-artur',
    });
    usersService.findByEmailAndTenant.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@barbeariadoartur.app',
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
    jwtService.sign.mockReturnValueOnce('reset-token');

    const result = await service.forgotPassword({
      tenantSubdomain: 'Barbearia do Artur',
      email: 'cliente@barbeariadoartur.app',
    });

    expect(result).toEqual({
      message:
        'Se esse email estiver cadastrado, enviaremos um link para trocar a senha em alguns minutos.',
      resetToken: 'reset-token',
      resetUrl: 'http://localhost:3001/auth/reset-password?token=reset-token',
    });
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        tenantId: 'tenant-1',
        email: 'cliente@barbeariadoartur.app',
        purpose: 'password-reset',
      }),
      {
        expiresIn: '20m',
        secret: 'password-reset-secret-for-tests',
      },
    );
  });

  it('resets password with a valid reset token and revokes open sessions', async () => {
    jwtService.verify.mockReturnValueOnce({
      sub: 'user-1',
      tenantId: 'tenant-1',
      email: 'cliente@barbeariadoartur.app',
      purpose: 'password-reset',
      passwordHashDigest:
        'fb59a3d960ec6f3f85771b15cb3174ea44033647599fe0b89690754ea1093c35',
    });
    usersService.findByIdAndTenant.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@barbeariadoartur.app',
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
    mockedBcrypt.hash.mockResolvedValue('new-hashed-password' as never);
    usersService.updatePassword.mockResolvedValue(undefined);
    prismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    const result = await service.resetPassword({
      token: 'reset-token',
      password: 'NovaSenha123!',
    });

    expect(jwtService.verify).toHaveBeenCalledWith('reset-token', {
      secret: 'password-reset-secret-for-tests',
    });
    expect(usersService.updatePassword).toHaveBeenCalledWith(
      'user-1',
      'tenant-1',
      'new-hashed-password',
    );
    expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      message: 'Senha atualizada. Entre de novo para continuar cuidando da agenda.',
    });
  });
});

