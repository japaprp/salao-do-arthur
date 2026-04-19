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
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponsService } from './coupons.service';

@ApiTags('coupons')
@Controller('coupons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar cupom' })
  @ApiResponse({ status: 201, description: 'Cupom criado com sucesso' })
  create(@Body() createCouponDto: CreateCouponDto, @CurrentUser() user: AuthenticatedUser) {
    return this.couponsService.create(user.tenantId, createCouponDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cupons' })
  @ApiResponse({ status: 200, description: 'Cupons retornados com sucesso' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.couponsService.findAllByTenant(user.tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar cupons ativos' })
  @ApiResponse({ status: 200, description: 'Cupons ativos retornados com sucesso' })
  findActive(@CurrentUser() user: AuthenticatedUser) {
    return this.couponsService.findActiveByTenant(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cupom por ID' })
  @ApiParam({ name: 'id', description: 'ID do cupom' })
  @ApiResponse({ status: 200, description: 'Cupom encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.couponsService.findByIdAndTenant(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cupom' })
  @ApiParam({ name: 'id', description: 'ID do cupom' })
  @ApiResponse({ status: 200, description: 'Cupom atualizado com sucesso' })
  update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.couponsService.update(id, user.tenantId, updateCouponDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar cupom' })
  @ApiParam({ name: 'id', description: 'ID do cupom' })
  @ApiResponse({ status: 200, description: 'Cupom desativado com sucesso' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.couponsService.remove(id, user.tenantId);
  }
}
