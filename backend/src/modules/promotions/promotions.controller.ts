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
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsService } from './promotions.service';

@ApiTags('promotions')
@Controller('promotions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar promoção' })
  @ApiResponse({ status: 201, description: 'Promoção criada com sucesso' })
  create(
    @Body() createPromotionDto: CreatePromotionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.promotionsService.create(user.tenantId, createPromotionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar promoções' })
  @ApiResponse({ status: 200, description: 'Promoções retornadas com sucesso' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.promotionsService.findAllByTenant(user.tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar promoções ativas' })
  @ApiResponse({ status: 200, description: 'Promoções ativas retornadas com sucesso' })
  findActive(@CurrentUser() user: AuthenticatedUser) {
    return this.promotionsService.findActiveByTenant(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar promoção por ID' })
  @ApiParam({ name: 'id', description: 'ID da promoção' })
  @ApiResponse({ status: 200, description: 'Promoção encontrada' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.promotionsService.findByIdAndTenant(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar promoção' })
  @ApiParam({ name: 'id', description: 'ID da promoção' })
  @ApiResponse({ status: 200, description: 'Promoção atualizada com sucesso' })
  update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.promotionsService.update(id, user.tenantId, updatePromotionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar promoção' })
  @ApiParam({ name: 'id', description: 'ID da promoção' })
  @ApiResponse({ status: 200, description: 'Promoção desativada com sucesso' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.promotionsService.remove(id, user.tenantId);
  }
}
