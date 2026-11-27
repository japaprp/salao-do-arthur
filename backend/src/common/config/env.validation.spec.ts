import { validate } from './env.validation';

describe('production environment validation', () => {
  const validProductionConfig = () => ({
    NODE_ENV: 'production',
    DATABASE_URL: 'mysql://user:password@db.example.test:3306/salao',
    JWT_SECRET: 'a'.repeat(40),
    REFRESH_TOKEN_SECRET: 'b'.repeat(40),
    PASSWORD_RESET_SECRET: 'c'.repeat(40),
    CORS_ORIGINS: 'https://japaprp.github.io',
  });

  it('accepts distinct strong secrets and explicit production CORS origins', () => {
    expect(() => validate(validProductionConfig())).not.toThrow();
  });

  it('rejects missing production secrets', () => {
    const config = validProductionConfig();
    delete (config as Partial<typeof config>).REFRESH_TOKEN_SECRET;

    expect(() => validate(config)).toThrow('REFRESH_TOKEN_SECRET');
  });

  it('rejects reused secrets', () => {
    const config = validProductionConfig();
    config.REFRESH_TOKEN_SECRET = config.JWT_SECRET;

    expect(() => validate(config)).toThrow('must be different');
  });

  it('rejects placeholder secrets', () => {
    const config = validProductionConfig();
    config.JWT_SECRET = 'troque_por_um_secret_longo_e_aleatorio';

    expect(() => validate(config)).toThrow('JWT_SECRET');
  });

  it('rejects production without explicit CORS origins', () => {
    const config = validProductionConfig();
    config.CORS_ORIGINS = '';

    expect(() => validate(config)).toThrow('CORS_ORIGINS');
  });
});
