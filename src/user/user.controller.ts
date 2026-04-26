import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '내 프로필 조회 (JWT 필요)' })
  @ApiOkResponse({
    description: '사용자 프로필 정보',
    schema: {
      example: {
        message: '성공',
        data: {
          id: 1,
          email: 'user@example.com',
          name: '홍길동',
          birthDate: '2000-01-01',
          countryCode: 'KR',
          phoneNumber: '+821012345678',
        },
      },
    },
  })
  @Get('profile')
  async getProfile(@Request() req: { user: { id: number } }) {
    return this.usersService.findById(req.user.id);
  }

  @ApiOperation({ summary: '프로필 수정 (JWT 필요)' })
  @ApiOkResponse({
    description: '수정 성공',
    schema: { example: { message: '성공', data: null } },
  })
  @Put('profile')
  async updateProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateProfileDto,
  ) {
    await this.usersService.updateProfile(req.user.id, dto);
  }
}
