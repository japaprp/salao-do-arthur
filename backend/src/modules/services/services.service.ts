import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from './repositories/services.repository';
import { CreateServiceInput } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) {}

  async create(createServiceDto: CreateServiceInput) {
    return this.servicesRepository.create(createServiceDto);
  }

  async findAllByTenant(tenantId: string) {
    return this.servicesRepository.findAllByTenant(tenantId);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }
    return service;
  }

  async findActiveByTenant(tenantId: string) {
    return this.servicesRepository.findActiveByTenant(tenantId);
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, tenantId: string) {
    // Verificar se o serviço existe no tenant
    await this.findByIdAndTenant(id, tenantId);

    return this.servicesRepository.update(id, tenantId, updateServiceDto);
  }

  async remove(id: string, tenantId: string) {
    // Verificar se o serviço existe no tenant
    await this.findByIdAndTenant(id, tenantId);

    return this.servicesRepository.remove(id, tenantId);
  }
}
