import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

const createMockContext = (userRole?: UserRole): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => (userRole ? { user: { role: userRole } } : { user: undefined }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('requiredRoles 없음 → true 반환', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createMockContext())).toBe(true);
  });

  it('역할 일치 (ADMIN) → true 반환', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(createMockContext(UserRole.ADMIN))).toBe(true);
  });

  it('역할 불일치 (USER → ADMIN 필요) → ForbiddenException', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createMockContext(UserRole.USER))).toThrow(ForbiddenException);
  });

  it('user 없음 → ForbiddenException', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createMockContext())).toThrow(ForbiddenException);
  });
});
