import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MANAGEMENT_ROLES, Roles } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('services')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Criar novo serviço' })
  @ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createServiceDto: CreateServiceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.create({
      ...createServiceDto,
      tenantId: user.tenantId,
    });
  }

  @Get()
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Listar todos os serviços' })
  @ApiResponse({ status: 200, description: 'Lista de serviços retornada' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findAllByTenant(user.tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar serviços ativos' })
  @ApiResponse({ status: 200, description: 'Lista de serviços ativos retornada' })
  findActive(@CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findActiveByTenant(user.tenantId);
  }

  @Get(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço encontrado' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findByIdAndTenant(id, user.tenantId);
  }

  @Put(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.update(id, updateServiceDto, user.tenantId);
  }

  @Delete(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Remover serviço' })
  @ApiParam({ name: 'id', description: 'ID do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.remove(id, user.tenantId);
  }
}
