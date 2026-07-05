import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RefreshTokenDto, RefreshTokenResponseDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Prisma, User, UserRole } from '@prisma/client';
import type { StringValue } from 'ms';
import { PrismaService, TenantPrismaClient } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string | number;
  refreshExpiresIn: string | number;
  user: SafeUser;
};

type SafeUser = Omit<User, 'passwordHash'>;

type PasswordResetPayload = {
  sub: string;
  tenantId: string;
  email: string;
  purpose: 'password-reset';
  passwordHashDigest: string;
};

type RefreshTokenPayload = {
  sub: string;
  email?: string;
  role?: string;
  tenantId?: string;
};

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn: StringValue | number;
  private readonly refreshTokenExpiresIn: StringValue | number;

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.jwtExpiresIn = this.configService.get<StringValue | number>(
      'JWT_EXPIRES_IN',
      '1h' as StringValue,
    );
    this.refreshTokenExpiresIn = this.configService.get<StringValue | number>(
      'REFRESH_TOKEN_EXPIRES_IN',
      '7d' as StringValue,
    );
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const tenant = await this.tenantsService.findBySubdomain(
      this.normalizeTenantSubdomain(loginDto.tenantSubdomain),
    );
    if (!tenant) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const user = await this.usersService.findByEmailAndTenant(loginDto.email, tenant.id);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const authResponse = await this.createAuthResponse(user);
    await this.recordAuthAudit(user.tenantId, user.id, 'AUTH_LOGIN');
    return authResponse;
  }

  async getProfile(authenticatedUser: AuthenticatedUser): Promise<SafeUser> {
    const user = await this.usersService.findByIdAndTenant(
      authenticatedUser.userId,
      authenticatedUser.tenantId,
    );

    return this.toSafeUser(user);
  }

  async register(registerDto: RegisterDto): Promise<SafeUser> {
    const user = await this.createUser(registerDto, UserRole.CLIENT);
    await this.recordAuthAudit(user.tenantId, user.id, 'AUTH_REGISTER_CLIENT');
    return this.toSafeUser(user);
  }

  async registerAdmin(registerAdminDto: RegisterAdminDto): Promise<AuthResponse> {
    const user = await this.createUser(registerAdminDto, UserRole.OWNER);
    const authResponse = await this.createAuthResponse(user);
    await this.recordAuthAudit(user.tenantId, user.id, 'AUTH_REGISTER_OWNER');
    return authResponse;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const response = {
      message:
        'Se esse email estiver cadastrado, enviaremos um link para trocar a senha em alguns minutos.',
      resetToken: undefined as string | undefined,
      resetUrl: undefined as string | undefined,
    };
    const tenant = await this.tenantsService.findBySubdomain(
      this.normalizeTenantSubdomain(forgotPasswordDto.tenantSubdomain),
    );

    if (!tenant) {
      return response;
    }

    const user = await this.usersService.findByEmailAndTenant(forgotPasswordDto.email, tenant.id);
    if (!user || !user.isActive) {
      return response;
    }

    const resetToken = this.createPasswordResetToken(user);
    const resetUrl = `${this.getWebAppUrl()}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
    await this.recordAuthAudit(user.tenantId, user.id, 'AUTH_PASSWORD_RESET_REQUESTED');

    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      response.resetToken = resetToken;
      response.resetUrl = resetUrl;
    }

    // Production email/WhatsApp delivery should consume resetUrl here.
    return response;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    let payload: PasswordResetPayload;

    try {
      payload = this.jwtService.verify<PasswordResetPayload>(resetPasswordDto.token, {
        secret: this.getPasswordResetSecret(),
      });
    } catch {
      throw new UnauthorizedException('Link inválido ou expirado. Peça um novo link.');
    }

    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Link inválido para troca de senha.');
    }

    const user = await this.usersService.findByIdAndTenant(payload.sub, payload.tenantId);
    if (
      !user.isActive ||
      user.email !== payload.email ||
      this.getPasswordHashDigest(user.passwordHash) !== payload.passwordHashDigest
    ) {
      throw new UnauthorizedException('Link inválido ou expirado. Peça um novo link.');
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.password, 12);
    await this.usersService.updatePassword(user.id, user.tenantId, passwordHash);
    await this.recordAuthAudit(user.tenantId, user.id, 'AUTH_PASSWORD_RESET_COMPLETED');
    await this.logout(user.id);

    return {
      message: 'Senha atualizada. Entre de novo para continuar cuidando da agenda.',
    };
  }

  private async createUser(
    registerDto: RegisterDto | RegisterAdminDto,
    role: UserRole,
  ): Promise<User> {
    const tenantId = await this.resolveTenant(registerDto, role);
    const passwordHash: string = await bcrypt.hash(registerDto.password, 12);

    try {
      return await this.prisma.withTenant<User>(
        tenantId,
        async (transaction: TenantPrismaClient): Promise<User> => {
          const createdUser = await transaction.user.create({
            data: {
              email: registerDto.email,
              phone: registerDto.phone,
              passwordHash,
              name: registerDto.name,
              role,
              tenantId,
            },
          });

          if (role === UserRole.CLIENT) {
            await transaction.client.create({
              data: {
                userId: createdUser.id,
                tenantId,
              },
            });
          }

          if (role === UserRole.OWNER || role === UserRole.MANAGER || role === UserRole.ADMIN) {
            await transaction.adminProfile.create({
              data: {
                userId: createdUser.id,
                tenantId,
              },
            });
          }

          return createdUser;
        },
      );
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email já está cadastrado.');
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new ConflictException('Não foi possível concluir o registro.');
    }
  }

  private async resolveTenant(
    registerDto: RegisterDto | RegisterAdminDto,
    role: UserRole,
  ): Promise<string> {
    if (role === UserRole.CLIENT) {
      if ('tenantId' in registerDto && registerDto.tenantId) {
        const tenant = await this.tenantsService.findById(registerDto.tenantId);
        if (!tenant) {
          throw new ConflictException('Barbearia não encontrada.');
        }
        return tenant.id;
      }

      const tenantSubdomain =
        'tenantSubdomain' in registerDto ? registerDto.tenantSubdomain : undefined;
      const tenant = await this.tenantsService.findBySubdomain(
        this.normalizeTenantSubdomain(tenantSubdomain),
      );
      if (!tenant) {
        throw new ConflictException('Barbearia do Artur não encontrada.');
      }
      return tenant.id;
    }

    if (!('organizationName' in registerDto) || !registerDto.organizationName) {
      throw new BadRequestException('Informe o nome da barbearia para criar a conta do Artur.');
    }

    const subdomain = this.normalizeTenantSubdomain(registerDto.organizationName);
    const tenant = await this.tenantsService.createTenant({
      name: registerDto.organizationName,
      subdomain,
      locale: registerDto.locale,
    });

    return tenant.id;
  }

  private normalizeTenantSubdomain(value?: string | null): string {
    const fallbackSubdomain =
      this.configService.get<string>('DEFAULT_TENANT_SUBDOMAIN') ?? 'barbearia-do-artur';

    return (value?.trim() || fallbackSubdomain)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  private createPasswordResetToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
        purpose: 'password-reset',
        passwordHashDigest: this.getPasswordHashDigest(user.passwordHash),
      } satisfies PasswordResetPayload,
      {
        expiresIn: '20m',
        secret: this.getPasswordResetSecret(),
      },
    );
  }

  private getPasswordHashDigest(passwordHash: string): string {
    return crypto.createHash('sha256').update(passwordHash).digest('hex');
  }

  private getPasswordResetSecret(): string {
    return this.configService.get<string>('PASSWORD_RESET_SECRET')
      ?? this.configService.get<string>('JWT_SECRET', 'change_this_password_reset_secret');
  }

  private getWebAppUrl(): string {
    return this.configService.get<string>('WEB_APP_URL')
      ?? this.configService.get<string>('FRONTEND_URL')
      ?? 'http://localhost:3001';
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError | { code: 'P2002' } {
    return (
      (error instanceof Prisma.PrismaClientKnownRequestError ||
        (typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === 'P2002')) &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  private toSafeUser(user: User): SafeUser {
    const { passwordHash, ...safeUser } = user;
    void passwordHash;
    return safeUser;
  }

  getRefreshTokenMaxAgeMs(): number {
    const unit = (this.refreshTokenExpiresIn as string).match(/[a-zA-Z]+/)?.[0] || 'd';
    const value = parseInt((this.refreshTokenExpiresIn as string).match(/\d+/)?.[0] || '7');

    if (unit === 'd') return value * 24 * 60 * 60 * 1000;
    if (unit === 'h') return value * 60 * 60 * 1000;
    if (unit === 'm') return value * 60 * 1000;
    return value * 1000;
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: this.jwtExpiresIn });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      refreshExpiresIn: this.refreshTokenExpiresIn,
      user: this.toSafeUser(user),
    };
  }

  private async generateRefreshToken(userId: string) {
    const expirationDate = new Date();
    // Parse refreshTokenExpiresIn (ex: '7d')
    const unit = (this.refreshTokenExpiresIn as string).match(/[a-zA-Z]+/)?.[0] || 'd';
    const value = parseInt((this.refreshTokenExpiresIn as string).match(/\d+/)?.[0] || '7');

    if (unit === 'd') expirationDate.setDate(expirationDate.getDate() + value);
    else if (unit === 'h') expirationDate.setHours(expirationDate.getHours() + value);
    else expirationDate.setSeconds(expirationDate.getSeconds() + value);

    const tokenId = crypto.randomUUID();
    const tokenPayload = {
      sub: userId,
      jti: tokenId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    };

    const token = this.jwtService.sign(tokenPayload, {
      expiresIn: this.refreshTokenExpiresIn,
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET', 'change_this_refresh_secret'),
    });

    // Armazenar no banco
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt: expirationDate,
      },
    });

    return refreshToken;
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    if (!refreshTokenDto.refreshToken) {
      throw new UnauthorizedException('Refresh token ausente.');
    }

    const payload = this.jwtService.verify<RefreshTokenPayload>(refreshTokenDto.refreshToken, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET', 'change_this_refresh_secret'),
    });
    const userId = payload.sub;

    // Validar se o token existe e não foi revogado
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
    });

    if (!refreshToken || refreshToken.revokedAt) {
      throw new UnauthorizedException('Refresh token inválido ou revogado.');
    }

    // Validar expiração
    if (new Date(refreshToken.expiresAt) < new Date()) {
      throw new UnauthorizedException('Refresh token expirado.');
    }

    // Buscar usuário
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
    }

    // Gerar novo access token
    const newAccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const newAccessToken = this.jwtService.sign(newAccessTokenPayload, {
      expiresIn: this.jwtExpiresIn,
    });

    // Opcionalmente rotacionar refresh token
    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    });

    const newRefreshToken = await this.generateRefreshToken(userId);
    await this.recordAuthAudit(user.tenantId, user.id, 'AUTH_REFRESH_TOKEN_ROTATED');

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
    };
  }

  async logout(userId: string): Promise<void> {
    // Revogar todos os refresh tokens do usuário
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const user = await this.usersService.findById(userId);
    if (user) {
      await this.recordAuthAudit(user.tenantId, user.id, 'AUTH_LOGOUT');
    }
  }

  private async recordAuthAudit(tenantId: string, userId: string, action: string): Promise<void> {
    await this.auditService.record({
      tenantId,
      userId,
      action,
      entity: 'AuthSession',
      entityId: userId,
      severity: 'INFO',
    });
  }
}
