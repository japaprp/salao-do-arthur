import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('professionals')
@Controller('professionals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo profissional' })
  @ApiResponse({ status: 201, description: 'Profissional criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Body() createProfessionalDto: CreateProfessionalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.professionalsService.create({
      ...createProfessionalDto,
      tenantId: user.tenantId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os profissionais' })
  @ApiResponse({ status: 200, description: 'Lista de profissionais retornada' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.professionalsService.findAllByTenant(user.tenantId);
  }

  @Get('available/:serviceId')
  @ApiOperation({ summary: 'Listar profissionais disponíveis para um serviço' })
  @ApiParam({ name: 'serviceId', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Lista de profissionais retornada' })
  findAvailable(@Param('serviceId') serviceId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.professionalsService.findAvailableForService(serviceId, user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar profissional por ID' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Profissional encontrado' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.professionalsService.findByIdAndTenant(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar profissional' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Profissional atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateProfessionalDto: UpdateProfessionalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.professionalsService.update(id, updateProfessionalDto, user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover profissional' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiResponse({ status: 200, description: 'Profissional removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.professionalsService.remove(id, user.tenantId);
  }
}
