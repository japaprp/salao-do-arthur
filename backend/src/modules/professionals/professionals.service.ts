import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProfessionalsRepository } from './repositories/professionals.repository';
import { ProfessionalServicesRepository } from './repositories/professional-services.repository';
import { UsersService } from '../users/users.service';
import { ServicesService } from '../services/services.service';
import { CreateProfessionalInput } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { SyncProfessionalServicesDto } from './dto/sync-professional-services.dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly professionalsRepository: ProfessionalsRepository,
    private readonly professionalServicesRepository: ProfessionalServicesRepository,
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(createProfessionalDto: CreateProfessionalInput) {
    // Verificar se o usuário existe e é do mesmo tenant
    await this.usersService.findByIdAndTenant(
      createProfessionalDto.userId,
      createProfessionalDto.tenantId,
    );

    // Verificar se já existe profissional para este usuário
    const existingProfessional = await this.professionalsRepository.findByUserIdAndTenant(
      createProfessionalDto.userId,
      createProfessionalDto.tenantId,
    );
    if (existingProfessional) {
      throw new ConflictException('Já existe um profissional cadastrado para este usuário.');
    }

    return this.professionalsRepository.create(createProfessionalDto);
  }

  async findAllByTenant(tenantId: string) {
    return this.professionalsRepository.findAllByTenant(tenantId);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const professional = await this.professionalsRepository.findByIdAndTenant(id, tenantId);
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }
    return professional;
  }

  async findAvailableForService(serviceId: string, tenantId: string) {
    return this.professionalsRepository.findAvailableForService(serviceId, tenantId);
  }

  async findServiceLinks(id: string, tenantId: string) {
    await this.findByIdAndTenant(id, tenantId);
    return this.professionalServicesRepository.findByProfessionalIdAndTenant(id, tenantId);
  }

  async syncServices(
    id: string,
    syncProfessionalServicesDto: SyncProfessionalServicesDto,
    tenantId: string,
  ) {
    await this.findByIdAndTenant(id, tenantId);

    const duplicatedServiceIds = findDuplicatedServiceIds(syncProfessionalServicesDto.services);
    if (duplicatedServiceIds.length > 0) {
      throw new BadRequestException(
        `Serviços duplicados no vínculo do profissional: ${duplicatedServiceIds.join(', ')}`,
      );
    }

    await Promise.all(
      syncProfessionalServicesDto.services.map(item =>
        this.servicesService.findByIdAndTenant(item.serviceId, tenantId),
      ),
    );

    return this.professionalServicesRepository.sync(
      id,
      tenantId,
      syncProfessionalServicesDto.services,
    );
  }

  async update(id: string, updateProfessionalDto: UpdateProfessionalDto, tenantId: string) {
    // Verificar se o profissional existe no tenant
    await this.findByIdAndTenant(id, tenantId);

    return this.professionalsRepository.update(id, tenantId, updateProfessionalDto);
  }

  async remove(id: string, tenantId: string) {
    // Verificar se o profissional existe no tenant
    await this.findByIdAndTenant(id, tenantId);

    return this.professionalsRepository.remove(id, tenantId);
  }
}

function findDuplicatedServiceIds(
  services: SyncProfessionalServicesDto['services'],
): string[] {
  const seenServiceIds = new Set<string>();
  const duplicatedServiceIds = new Set<string>();

  for (const service of services) {
    if (seenServiceIds.has(service.serviceId)) {
      duplicatedServiceIds.add(service.serviceId);
      continue;
    }

    seenServiceIds.add(service.serviceId);
  }

  return Array.from(duplicatedServiceIds);
}
