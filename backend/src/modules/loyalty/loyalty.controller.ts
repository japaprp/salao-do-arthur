import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AdjustLoyaltyDto } from './dto/adjust-loyalty.dto';
import { RedeemLoyaltyDto } from './dto/redeem-loyalty.dto';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('levels')
  getLevels() {
    return this.loyaltyService.getLevels();
  }

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.loyaltyService.getMine(user);
  }

  @Post('redeem')
  redeemMine(@CurrentUser() user: AuthenticatedUser, @Body() dto: RedeemLoyaltyDto) {
    return this.loyaltyService.redeemMine(user, dto);
  }

  @Get('clients/:clientId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION)
  getClient(@CurrentUser() user: AuthenticatedUser, @Param('clientId') clientId: string) {
    return this.loyaltyService.getClientLoyalty(user.tenantId, clientId);
  }

  @Post('clients/:clientId/redeem')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION)
  redeemClient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Body() dto: RedeemLoyaltyDto,
  ) {
    return this.loyaltyService.redeemClient(user, clientId, dto);
  }

  @Post('clients/:clientId/adjust')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  adjustClient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Body() dto: AdjustLoyaltyDto,
  ) {
    return this.loyaltyService.adjustClient(user, clientId, dto);
  }
}
