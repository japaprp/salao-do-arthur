import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { ServiceCategoriesService } from './service-categories.service';

@ApiTags('service-categories')
@Controller('service-categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ServiceCategoriesController {
  constructor(private readonly serviceCategoriesService: ServiceCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar categoria de serviço' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  create(
    @Body() createServiceCategoryDto: CreateServiceCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceCategoriesService.create(user.tenantId, createServiceCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias de serviço' })
  @ApiResponse({ status: 200, description: 'Categorias retornadas com sucesso' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.serviceCategoriesService.findAllByTenant(user.tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar categorias ativas' })
  @ApiResponse({ status: 200, description: 'Categorias ativas retornadas com sucesso' })
  findActive(@CurrentUser() user: AuthenticatedUser) {
    return this.serviceCategoriesService.findActiveByTenant(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria de serviço por ID' })
  @ApiParam({ name: 'id', description: 'ID da categoria de serviço' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.serviceCategoriesService.findByIdAndTenant(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria de serviço' })
  @ApiParam({ name: 'id', description: 'ID da categoria de serviço' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso' })
  update(
    @Param('id') id: string,
    @Body() updateServiceCategoryDto: UpdateServiceCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceCategoriesService.update(id, user.tenantId, updateServiceCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar categoria de serviço' })
  @ApiParam({ name: 'id', description: 'ID da categoria de serviço' })
  @ApiResponse({ status: 200, description: 'Categoria desativada com sucesso' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.serviceCategoriesService.remove(id, user.tenantId);
  }
}
