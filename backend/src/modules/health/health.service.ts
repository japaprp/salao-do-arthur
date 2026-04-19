import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness() {
    return {
      status: 'ok',
      mode: 'live',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        mode: 'ready',
        service: 'backend',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        mode: 'ready',
        service: 'backend',
        database: 'down',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Database connection failed',
      });
    }
  }
}
