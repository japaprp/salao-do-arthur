import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProfessionalsRepository } from './repositories/professionals.repository';
import { UsersService } from '../users/users.service';
import { CreateProfessionalInput } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly professionalsRepository: ProfessionalsRepository,
    private readonly usersService: UsersService,
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
