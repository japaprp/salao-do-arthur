import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NextFunction, Request, Response } from 'express';

const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function getAllowedOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

export function buildCorsOptions(): CorsOptions {
  const allowedOrigins = new Set(getAllowedOrigins());

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin) || localhostPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'Origin',
      'X-Requested-With',
      'X-Tenant-Id',
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 204,
  };
}

export function securityHeadersMiddleware(isProduction: boolean) {
  return (_request: Request, response: Response, next: NextFunction): void => {
    response.removeHeader('X-Powered-By');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader(
      'Permissions-Policy',
      'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
    );
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.setHeader('X-DNS-Prefetch-Control', 'off');
    response.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    response.setHeader('Origin-Agent-Cluster', '?1');

    if (isProduction) {
      response.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    next();
  };
}
