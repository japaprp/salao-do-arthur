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
import { MANAGEMENT_ROLES, Roles } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesService } from './product-categories.service';

@ApiTags('product-categories')
@Controller('product-categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  @Post()
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Criar categoria de produto' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  create(
    @Body() createProductCategoryDto: CreateProductCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productCategoriesService.create(user.tenantId, createProductCategoryDto);
  }

  @Get()
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Listar categorias de produto' })
  @ApiResponse({ status: 200, description: 'Categorias retornadas com sucesso' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.productCategoriesService.findAllByTenant(user.tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar categorias de produto ativas' })
  @ApiResponse({ status: 200, description: 'Categorias ativas retornadas com sucesso' })
  findActive(@CurrentUser() user: AuthenticatedUser) {
    return this.productCategoriesService.findActiveByTenant(user.tenantId);
  }

  @Get(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Buscar categoria de produto por ID' })
  @ApiParam({ name: 'id', description: 'ID da categoria de produto' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productCategoriesService.findByIdAndTenant(id, user.tenantId);
  }

  @Put(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Atualizar categoria de produto' })
  @ApiParam({ name: 'id', description: 'ID da categoria de produto' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso' })
  update(
    @Param('id') id: string,
    @Body() updateProductCategoryDto: UpdateProductCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productCategoriesService.update(id, user.tenantId, updateProductCategoryDto);
  }

  @Delete(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Desativar categoria de produto' })
  @ApiParam({ name: 'id', description: 'ID da categoria de produto' })
  @ApiResponse({ status: 200, description: 'Categoria desativada com sucesso' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productCategoriesService.remove(id, user.tenantId);
  }
}
