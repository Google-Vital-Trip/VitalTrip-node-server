import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '이메일 중복 확인' })
  @ApiOkResponse({
    description: '사용 가능 여부',
    schema: {
      example: { message: '성공', data: { available: true } },
    },
  })
  @Get('check-email')
  checkEmail(@Query() query: CheckEmailDto) {
    return this.authService.checkEmail(query.email);
  }

  @ApiOperation({ summary: '회원가입' })
  @ApiOkResponse({
    description: '회원가입 성공',
    schema: { example: { message: '성공', data: null } },
  })
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    await this.authService.signup(dto);
    return null;
  }

  @ApiOperation({ summary: '로그인' })
  @ApiOkResponse({
    description: 'Access/Refresh 토큰 발급',
    schema: {
      example: {
        message: '성공',
        data: {
          accessToken: 'eyJhbGci...',
          refreshToken: 'eyJhbGci...',
        },
      },
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @ApiOperation({ summary: '로그아웃 (JWT 필요)' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: '로그아웃 성공',
    schema: { example: { message: '성공', data: null } },
  })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: { user: { id: number } }) {
    await this.authService.logout(req.user.id);
    return null;
  }

  @ApiOperation({ summary: 'Access Token 재발급' })
  @ApiOkResponse({
    description: '새 Access/Refresh 토큰 발급',
    schema: {
      example: {
        message: '성공',
        data: {
          accessToken: 'eyJhbGci...',
          refreshToken: 'eyJhbGci...',
        },
      },
    },
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: '비밀번호 변경 (JWT 필요)' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: '비밀번호 변경 성공',
    schema: { example: { message: '성공', data: null } },
  })
  @UseGuards(JwtAuthGuard)
  @Put('password')
  async changePassword(
    @Request() req: { user: { id: number } },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.id, dto);
    return null;
  }
}
