import { Body, Controller, HttpCode, HttpStatus, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompleteProfileDto } from '../auth/dto/complete-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '프로필 업데이트 (JWT 필요)' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: '프로필 업데이트 성공',
    schema: { example: { message: '성공', data: null } },
  })
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: CompleteProfileDto,
  ) {
    await this.usersService.updateProfile(req.user.id, dto);
    return null;
  }
}
