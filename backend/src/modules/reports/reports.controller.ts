import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MANAGEMENT_ROLES, Roles } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Retorna visão consolidada de dashboard e relatórios' })
  @ApiResponse({ status: 200, description: 'Visão consolidada retornada com sucesso' })
  getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getOverview(user.tenantId);
  }

  @Get('export')
  @Roles(...MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Exporta relatório em PDF ou Excel' })
  async exportOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query('format') format: 'pdf' | 'excel' = 'excel',
    @Res() response: Response,
  ) {
    const exportFile = await this.reportsService.exportOverview(
      user.tenantId,
      format === 'pdf' ? 'pdf' : 'excel',
    );
    response.setHeader('Content-Type', exportFile.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${exportFile.filename}"`);
    response.send(exportFile.body);
  }
}
