import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_PATH } from './auth.constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const authResponse = await this.authService.login(loginDto);
    this.setRefreshTokenCookie(response, authResponse.refreshToken);
    return authResponse;
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  @ApiOperation({ summary: 'Registro público de cliente' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/admin')
  @Throttle({ default: { limit: 2, ttl: 60 * 60 * 1000 } })
  @ApiOperation({ summary: 'Onboarding inicial do salão com conta gestora' })
  @ApiResponse({ status: 201, description: 'Conta gestora criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Email ou organização já cadastrados' })
  async registerAdmin(
    @Body() registerAdminDto: RegisterAdminDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResponse = await this.authService.registerAdmin(registerAdminDto);
    this.setRefreshTokenCookie(response, authResponse.refreshToken);
    return authResponse;
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  @ApiOperation({ summary: 'Solicitar link de recuperação de senha' })
  @ApiResponse({ status: 200, description: 'Solicitação recebida sem expor existência do email' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @ApiOperation({ summary: 'Redefinir senha com link temporário' })
  @ApiResponse({ status: 200, description: 'Senha atualizada com sucesso' })
  @ApiResponse({ status: 401, description: 'Link inválido ou expirado' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 15 * 60 * 1000 } })
  @ApiOperation({ summary: 'Renovar access token com refresh token' })
  @ApiResponse({ status: 200, description: 'Access token renovado com sucesso' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(
    @Req() request: Request,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromRequest(request) ?? refreshTokenDto.refreshToken;
    const authResponse = await this.authService.refresh({ refreshToken });
    this.setRefreshTokenCookie(response, authResponse.refreshToken);
    return authResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout de usuário (revoga todos os refresh tokens)' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(user.userId);
    this.clearRefreshTokenCookie(response);
    return { message: 'Logout realizado com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user);
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: this.authService.getRefreshTokenMaxAgeMs(),
    });
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
    });
  }

  private getRefreshTokenFromRequest(request: Request): string | undefined {
    const cookies: unknown = request.cookies;
    if (!cookies || typeof cookies !== 'object') {
      return undefined;
    }

    const refreshToken = (cookies as Record<string, unknown>)[REFRESH_TOKEN_COOKIE_NAME];
    return typeof refreshToken === 'string' ? refreshToken : undefined;
  }
}
