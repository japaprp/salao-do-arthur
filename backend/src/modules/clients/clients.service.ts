import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ClientsRepository } from './repositories/clients.repository';
import { UsersService } from '../users/users.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { CreateClientInput } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly usersService: UsersService,
    private readonly professionalsService: ProfessionalsService,
  ) {}

  async create(createClientDto: CreateClientInput) {
    // Verificar se o usuário existe e é do mesmo tenant
    await this.usersService.findByIdAndTenant(createClientDto.userId, createClientDto.tenantId);

    // Verificar se já existe cliente para este usuário
    const existingClient = await this.clientsRepository.findByUserIdAndTenant(
      createClientDto.userId,
      createClientDto.tenantId,
    );
    if (existingClient) {
      throw new ConflictException('Já existe um cliente cadastrado para este usuário.');
    }

    // Se foi informado profissional favorito, verificar se existe no tenant
    if (createClientDto.favoriteProfessionalId) {
      await this.professionalsService.findByIdAndTenant(
        createClientDto.favoriteProfessionalId,
        createClientDto.tenantId,
      );
    }

    return this.clientsRepository.create(createClientDto);
  }

  async findAllByTenant(tenantId: string) {
    return this.clientsRepository.findAllByTenant(tenantId);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const client = await this.clientsRepository.findByIdAndTenant(id, tenantId);
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return client;
  }

  async findByUserId(userId: string) {
    const client = await this.clientsRepository.findByUserId(userId);
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return client;
  }

  async findByUserIdAndTenant(userId: string, tenantId: string) {
    const client = await this.clientsRepository.findByUserIdAndTenant(userId, tenantId);
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto, tenantId: string) {
    // Verificar se o cliente existe no tenant
    await this.findByIdAndTenant(id, tenantId);

    // Se foi informado profissional favorito, verificar se existe no tenant
    if (updateClientDto.favoriteProfessionalId) {
      await this.professionalsService.findByIdAndTenant(
        updateClientDto.favoriteProfessionalId,
        tenantId,
      );
    }

    return this.clientsRepository.update(id, tenantId, updateClientDto);
  }

  async updateLoyaltyPoints(id: string, points: number, tenantId: string) {
    // Verificar se o cliente existe no tenant
    await this.findByIdAndTenant(id, tenantId);

    return this.clientsRepository.updateLoyaltyPoints(id, tenantId, points);
  }

  async updateLifetimeValue(id: string, value: number, tenantId: string) {
    // Verificar se o cliente existe no tenant
    await this.findByIdAndTenant(id, tenantId);

    return this.clientsRepository.updateLifetimeValue(id, tenantId, value);
  }

  async remove(id: string, tenantId: string) {
    // Verificar se o cliente existe no tenant
    await this.findByIdAndTenant(id, tenantId);

    return this.clientsRepository.remove(id, tenantId);
  }
}
