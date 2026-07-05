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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Criar produto' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso' })
  create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.create(user.tenantId, createProductDto);
  }

  @Get()
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiResponse({ status: 200, description: 'Produtos retornados com sucesso' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findAllByTenant(user.tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar produtos ativos' })
  @ApiResponse({ status: 200, description: 'Produtos ativos retornados com sucesso' })
  findActive(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findActiveByTenant(user.tenantId);
  }

  @Get(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findByIdAndTenant(id, user.tenantId);
  }

  @Put(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.update(id, user.tenantId, updateProductDto);
  }

  @Delete(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Desativar produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ status: 200, description: 'Produto desativado com sucesso' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.remove(id, user.tenantId);
  }
}
