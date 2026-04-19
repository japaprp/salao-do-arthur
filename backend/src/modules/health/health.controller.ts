import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar saúde da aplicação' })
  @ApiResponse({ status: 200, description: 'Aplicação saudável' })
  getHealth() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verificar prontidão da aplicação e do banco' })
  @ApiResponse({ status: 200, description: 'Aplicação pronta para receber tráfego' })
  @ApiResponse({ status: 503, description: 'Aplicação sem acesso ao banco' })
  getReadiness() {
    return this.healthService.getReadiness();
  }
}
