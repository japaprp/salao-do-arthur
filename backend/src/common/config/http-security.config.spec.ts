import { buildCorsOptions } from './http-security.config';

describe('CORS security policy', () => {
  const previousOrigins = process.env.CORS_ORIGINS;

  afterEach(() => {
    if (previousOrigins === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = previousOrigins;
    }
  });

  it('allows only explicitly configured origins in production', () => {
    process.env.CORS_ORIGINS = 'https://japaprp.github.io';
    const options = buildCorsOptions(true);
    const callback = jest.fn();
    const originHandler = options.origin as (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => void;

    originHandler('http://localhost:3001', callback);
    expect(callback).toHaveBeenCalledWith(expect.any(Error), false);

    originHandler('https://japaprp.github.io', callback);
    expect(callback).toHaveBeenLastCalledWith(null, true);
  });

  it('allows localhost origins only outside production', () => {
    process.env.CORS_ORIGINS = '';
    const options = buildCorsOptions(false);
    const callback = jest.fn();
    const originHandler = options.origin as (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => void;

    originHandler('http://localhost:3001', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });
});
