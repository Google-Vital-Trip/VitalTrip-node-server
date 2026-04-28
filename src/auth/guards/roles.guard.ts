import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role: UserRole } }>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        message: '관리자 권한이 필요합니다.',
        errorCode: ErrorCode.FORBIDDEN,
      });
    }
    return true;
  }
}
