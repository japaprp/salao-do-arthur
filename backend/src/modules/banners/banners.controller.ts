import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BannerPlacement } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MANAGEMENT_ROLES, Roles } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannersService } from './banners.service';

@ApiTags('banners')
@Controller('banners')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Criar banner' })
  @ApiResponse({ status: 201, description: 'Banner criado com sucesso' })
  create(@Body() createBannerDto: CreateBannerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bannersService.create(user.tenantId, createBannerDto);
  }

  @Get()
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Listar banners' })
  @ApiResponse({ status: 200, description: 'Banners retornados com sucesso' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.bannersService.findAllByTenant(user.tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar banners ativos' })
  @ApiResponse({ status: 200, description: 'Banners ativos retornados com sucesso' })
  findActive(@CurrentUser() user: AuthenticatedUser) {
    return this.bannersService.findActiveByTenant(user.tenantId);
  }

  @Get('placements/:placement')
  @ApiOperation({ summary: 'Listar banners por posicionamento' })
  @ApiParam({ name: 'placement', enum: BannerPlacement })
  @ApiResponse({ status: 200, description: 'Banners filtrados por posicionamento' })
  findByPlacement(
    @Param('placement') placement: BannerPlacement,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bannersService.findByPlacement(user.tenantId, placement);
  }

  @Get(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Buscar banner por ID' })
  @ApiParam({ name: 'id', description: 'ID do banner' })
  @ApiResponse({ status: 200, description: 'Banner encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bannersService.findByIdAndTenant(id, user.tenantId);
  }

  @Put(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Atualizar banner' })
  @ApiParam({ name: 'id', description: 'ID do banner' })
  @ApiResponse({ status: 200, description: 'Banner atualizado com sucesso' })
  update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bannersService.update(id, user.tenantId, updateBannerDto);
  }

  @Delete(':id')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Desativar banner' })
  @ApiParam({ name: 'id', description: 'ID do banner' })
  @ApiResponse({ status: 200, description: 'Banner desativado com sucesso' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bannersService.remove(id, user.tenantId);
  }
}
