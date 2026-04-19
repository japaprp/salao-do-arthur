import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateSalonSettingsDto } from './dto/update-salon-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('salon')
  @ApiOperation({ summary: 'Buscar configurações do salão' })
  @ApiResponse({ status: 200, description: 'Configurações retornadas com sucesso' })
  findSalonSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getByTenantId(user.tenantId);
  }

  @Put('salon')
  @ApiOperation({ summary: 'Atualizar configurações do salão' })
  @ApiResponse({ status: 200, description: 'Configurações atualizadas com sucesso' })
  updateSalonSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateSalonSettingsDto: UpdateSalonSettingsDto,
  ) {
    return this.settingsService.updateByTenantId(user.tenantId, updateSalonSettingsDto);
  }
}
