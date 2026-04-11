import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn: string | number;

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.jwtExpiresIn = this.configService.get<string | number>('JWT_EXPIRES_IN', '2h');
  }

  async login(loginDto: LoginDto) {
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

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
    };
  }

  async register(registerDto: RegisterDto) {
    const tenantId = await this.resolveTenant(registerDto);
    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    const role = registerDto.role ?? UserRole.CLIENT;

    try {
      const user = await this.prisma.withTenant(tenantId, async transaction => {
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

        return createdUser;
      });

      const { passwordHash: _, ...payloadUser } = user;
      return payloadUser;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email já está cadastrado.');
      }

      throw error;
    }
  }

  private async resolveTenant(registerDto: RegisterDto) {
    if (registerDto.tenantSubdomain) {
      const tenant = await this.tenantsService.findBySubdomain(
        this.normalizeTenantSubdomain(registerDto.tenantSubdomain),
      );
      if (!tenant) {
        throw new ConflictException('Salão não encontrado.');
      }
      return tenant.id;
    }

    if (registerDto.tenantId) {
      const tenant = await this.tenantsService.findById(registerDto.tenantId);
      if (!tenant) {
        throw new ConflictException('Tenant não encontrado.');
      }
      return tenant.id;
    }

    if (!registerDto.organizationName) {
      throw new ConflictException(
        'Informe o codigo do salão existente ou o nome da empresa para criar um tenant.',
      );
    }

    const subdomain = this.normalizeTenantSubdomain(registerDto.organizationName);
    const tenant = await this.tenantsService.createTenant({
      name: registerDto.organizationName,
      subdomain,
      locale: registerDto.locale,
    });

    return tenant.id;
  }

  private normalizeTenantSubdomain(value: string) {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      (error instanceof Prisma.PrismaClientKnownRequestError ||
        (typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === 'P2002')) &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
