import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { StoreService } from './store.service';

@ApiTags('store')
@Controller('store')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('products')
  @ApiOperation({ summary: 'Listar produtos ativos da loja' })
  @ApiResponse({ status: 200, description: 'Produtos retornados com sucesso' })
  listProducts(@CurrentUser() user: AuthenticatedUser) {
    return this.storeService.listProducts(user.tenantId);
  }

  @Get('cart')
  @ApiOperation({ summary: 'Buscar carrinho ativo do cliente' })
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.storeService.getCart(user);
  }

  @Post('cart/items')
  @ApiOperation({ summary: 'Adicionar produto ao carrinho' })
  addCartItem(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddCartItemDto) {
    return this.storeService.addCartItem(user, dto);
  }

  @Put('cart/items/:itemId')
  @ApiOperation({ summary: 'Atualizar quantidade de item no carrinho' })
  @ApiParam({ name: 'itemId', description: 'ID do item do carrinho' })
  updateCartItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.storeService.updateCartItem(user, itemId, dto);
  }

  @Delete('cart/items/:itemId')
  @ApiOperation({ summary: 'Remover item do carrinho' })
  @ApiParam({ name: 'itemId', description: 'ID do item do carrinho' })
  removeCartItem(@CurrentUser() user: AuthenticatedUser, @Param('itemId') itemId: string) {
    return this.storeService.removeCartItem(user, itemId);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Finalizar carrinho e criar pedido' })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.storeService.checkout(user, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Histórico de pedidos do cliente' })
  listOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.storeService.listOrders(user);
  }

  @Get('admin/orders')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION)
  @ApiOperation({ summary: 'Listar pedidos da loja para operação/administração' })
  listTenantOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.storeService.listTenantOrders(user.tenantId);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Listar produtos favoritos do cliente' })
  listFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.storeService.listFavorites(user);
  }

  @Post('favorites/:productId')
  @ApiOperation({ summary: 'Adicionar produto aos favoritos' })
  @ApiParam({ name: 'productId', description: 'ID do produto' })
  addFavorite(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string) {
    return this.storeService.addFavorite(user, productId);
  }

  @Delete('favorites/:productId')
  @ApiOperation({ summary: 'Remover produto dos favoritos' })
  @ApiParam({ name: 'productId', description: 'ID do produto' })
  removeFavorite(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string) {
    return this.storeService.removeFavorite(user, productId);
  }
}
