import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../constants/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 오류가 발생했습니다.';
    let errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string) ?? exception.message;
        errorCode =
          (res.errorCode as ErrorCode) ?? this.statusToErrorCode(status);

        // ValidationPipe 에러는 message가 배열
        if (Array.isArray(res.message)) {
          message = (res.message as string[]).join(', ');
          errorCode = ErrorCode.VALIDATION_FAILED;
        }
      } else {
        message = exceptionResponse;
        errorCode = this.statusToErrorCode(status);
      }
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception,
      );
    }

    response.status(status).json({
      message,
      data: null,
      errorCode,
    });
  }

  private statusToErrorCode(status: HttpStatus): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.UNPROCESSABLE_ENTITY:
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
