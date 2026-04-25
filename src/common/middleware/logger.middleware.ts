import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const start = Date.now();

    res.on('finish', () => {
      const ms = Date.now() - start;
      this.logger.log(`${method} ${originalUrl} ${res.statusCode} ${ms}ms - ${ip}`);
    });

    next();
  }
}
