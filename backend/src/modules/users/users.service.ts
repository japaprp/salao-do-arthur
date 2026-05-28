import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findByEmailAndTenant(email: string, tenantId: string) {
    return this.usersRepository.findByEmailAndTenant(email, tenantId);
  }

  async findByPhone(phone: string) {
    return this.usersRepository.findByPhone(phone);
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const user = await this.usersRepository.findByIdAndTenant(id, tenantId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async createUser(data: {
    email: string;
    phone?: string;
    passwordHash: string;
    name: string;
    role: UserRole;
    tenantId: string;
  }) {
    return this.usersRepository.createUser(data);
  }

  async updatePassword(userId: string, tenantId: string, passwordHash: string) {
    return this.usersRepository.updatePassword(userId, tenantId, passwordHash);
  }
}
