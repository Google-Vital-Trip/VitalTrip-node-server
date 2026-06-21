import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Request, Response } from 'express';
import { Counter, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram<string>,
    @InjectMetric('http_requests_total')
    private readonly counter: Counter<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // PrometheusModule 자체 /metrics 엔드포인트는 측정 제외
    if (req.path === '/metrics') {
      return next.handle();
    }

    const method = req.method;
    const routeInfo = req.route as { path: string } | undefined;
    const route = routeInfo?.path ?? req.path;
    const end = this.histogram.startTimer({ method, route });

    const record = (statusCode: number) => {
      end({ statusCode: String(statusCode) });
      this.counter.inc({ method, route, statusCode: String(statusCode) });
    };

    return next.handle().pipe(
      tap(() => record(res.statusCode)),
      catchError((err: unknown) => {
        record(res.statusCode || 500);
        throw err;
      }),
    );
  }
}
