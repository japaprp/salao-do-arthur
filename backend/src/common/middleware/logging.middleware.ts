import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as winston from 'winston';

type RequestWithId = Request & {
  id?: string;
};

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'barbearia-do-artur-backend' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const timestampText = typeof timestamp === 'string' ? timestamp : new Date().toISOString();
              const messageText = typeof message === 'string' ? message : JSON.stringify(message);
              return `${timestampText} [${level}]: ${messageText} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            }),
          ),
        }),
      );
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const requestId = (req as RequestWithId).id ?? Math.random().toString(36).slice(2, 11);

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logMeta = {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      if (res.statusCode >= 400) {
        this.logger.warn('HTTP Request', logMeta);
      } else {
        this.logger.info('HTTP Request', logMeta);
      }
    });

    next();
  }
}
