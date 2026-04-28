import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: '전체 사용자 목록 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'page', required: false, example: 0 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiOkResponse({
    schema: {
      example: {
        message: '성공',
        data: {
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
          hasContent: false,
          hasNext: false,
          hasPrevious: false,
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  async getUsers(@Query('page') page = 0, @Query('size') size = 20) {
    const pageNum = Number(page);
    const sizeNum = Math.min(Math.max(Number(size), 1), 100);
    return this.adminService.getUsers(pageNum, sizeNum);
  }

  @ApiOperation({ summary: '관리자 권한 확인' })
  @ApiOkResponse({
    schema: { example: { message: '성공', data: { isAdmin: true } } },
  })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('me')
  checkAdmin(@Request() req: { user?: { role: UserRole } | null }) {
    return { isAdmin: this.adminService.isAdmin(req.user ?? null) };
  }
}
