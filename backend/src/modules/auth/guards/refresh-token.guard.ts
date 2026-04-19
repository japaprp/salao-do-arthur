import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: unknown, user: any, _info: unknown, _context: ExecutionContext): any {
    if (err instanceof Error) {
      throw err;
    }

    if (err || !user) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    return user;
  }
}
