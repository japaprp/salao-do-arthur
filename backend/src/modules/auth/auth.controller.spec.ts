import { AuthController } from './auth.controller';
import { REFRESH_TOKEN_COOKIE_NAME } from './auth.constants';

describe('AuthController refresh token transport', () => {
  it('returns tokens to the native mobile client for secure device storage', async () => {
    const mobileSession = {
      accessToken: 'mobile-access-token',
      refreshToken: 'mobile-refresh-token',
      tokenType: 'Bearer' as const,
      expiresIn: '15m',
      refreshExpiresIn: '7d',
      user: { id: 'user-1', email: 'client@example.test' },
    };
    const authService = {
      login: jest.fn().mockResolvedValue(mobileSession),
    };
    const controller = new AuthController(authService as never, { get: jest.fn() } as never);

    const result = await controller.mobileLogin({} as never);

    expect(result).toEqual(mobileSession);
  });

  it('rotates mobile refresh tokens only when the body supplies a refresh token', async () => {
    const rotatedSession = {
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
      tokenType: 'Bearer' as const,
      expiresIn: '15m',
      refreshExpiresIn: '7d',
      user: { id: 'user-1', email: 'client@example.test' },
    };
    const authService = {
      refresh: jest.fn().mockResolvedValue(rotatedSession),
    };
    const controller = new AuthController(authService as never, { get: jest.fn() } as never);

    const result = await controller.mobileRefresh({ refreshToken: 'current-refresh-token' });

    expect(authService.refresh).toHaveBeenCalledWith({
      refreshToken: 'current-refresh-token',
    });
    expect(result).toEqual(rotatedSession);
  });

  it('sets refresh token only in an HttpOnly cookie, not in the JSON response', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'short-lived-access-token',
        refreshToken: 'long-lived-refresh-token',
        tokenType: 'Bearer',
        expiresIn: '15m',
        refreshExpiresIn: '7d',
        user: { id: 'user-1', email: 'artur@example.test' },
      }),
      getRefreshTokenMaxAgeMs: jest.fn().mockReturnValue(7 * 24 * 60 * 60 * 1000),
    };
    const configService = {
      get: jest.fn().mockReturnValue('production'),
    };
    const response = {
      cookie: jest.fn(),
    };
    const controller = new AuthController(authService as never, configService as never);

    const result = await controller.login({} as never, response as never);

    expect(result).toEqual({
      accessToken: 'short-lived-access-token',
      tokenType: 'Bearer',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
      user: { id: 'user-1', email: 'artur@example.test' },
    });
    expect(result).not.toHaveProperty('refreshToken');
    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'long-lived-refresh-token',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax' }),
    );
  });
});
