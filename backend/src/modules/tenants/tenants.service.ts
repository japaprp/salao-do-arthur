import { Injectable, ConflictException } from '@nestjs/common';
import { TenantsRepository } from './repositories/tenants.repository';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  async createTenant(data: { name: string; subdomain: string; locale?: string }) {
    const existing = await this.tenantsRepository.findBySubdomain(data.subdomain);
    if (existing) {
      throw new ConflictException('Subdomínio já está em uso.');
    }

    return this.tenantsRepository.createTenant(data);
  }

  async findBySubdomain(subdomain: string) {
    return this.tenantsRepository.findBySubdomain(subdomain);
  }

  async findById(id: string) {
    return this.tenantsRepository.findById(id);
  }
}
