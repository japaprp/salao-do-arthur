import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { FinanceService } from './finance.service';

type FinancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('overview')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  getOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period?: FinancePeriod,
  ) {
    return this.financeService.getOverview(user.tenantId, period);
  }

  @Post('transactions')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  createTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFinanceTransactionDto,
  ) {
    return this.financeService.createTransaction(user, dto);
  }
}
