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
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ErrorCode } from '../common/constants/error-codes';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import type { Request as ExpressRequest } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

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

  @ApiOperation({ summary: '관리자 로그인' })
  @ApiOkResponse({
    description: '어드민 로그인 성공 (accessToken/refreshToken 쿠키 설정)',
    schema: { example: { message: '어드민 로그인이 완료되었습니다', data: null } },
  })
  @ResponseMessage('어드민 로그인이 완료되었습니다')
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.adminLogin(
      dto.email,
      dto.password,
    );
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie('adminAccessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });
    res.cookie('adminRefreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return null;
  }

  @ApiOperation({ summary: '관리자 토큰 갱신 (쿠키 기반)' })
  @ApiOkResponse({
    schema: { example: { message: '토큰이 갱신되었습니다', data: null } },
  })
  @ResponseMessage('토큰이 갱신되었습니다')
  @Post('admin/refresh')
  @HttpCode(HttpStatus.OK)
  async adminRefresh(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)['adminRefreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException({
        message: '리프레시 토큰이 없습니다.',
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }
    const accessToken = await this.authService.adminRefresh(refreshToken);
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie('adminAccessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });
    return null;
  }

  @ApiOperation({ summary: 'Google OAuth2 콜백 (Google이 호출)' })
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL')!;
    const callbackPath = '/auth/callback';

    if (error || !code) {
      const params = new URLSearchParams({
        error: 'true',
        errorCode: ErrorCode.OAUTH_ERROR,
        message: 'Google 인증이 취소되었습니다.',
      });
      return res.redirect(`${frontendUrl}${callbackPath}?${params.toString()}`);
    }

    try {
      const result = await this.authService.handleGoogleCallback(code);

      if (result.type === 'existing') {
        const params = new URLSearchParams({
          success: 'true',
          accessToken: result.accessToken!,
          refreshToken: result.refreshToken!,
          email: result.email,
          name: result.name,
          ...(result.profileImageUrl && {
            profileImageUrl: result.profileImageUrl,
          }),
        });
        return res.redirect(
          `${frontendUrl}${callbackPath}?${params.toString()}`,
        );
      }

      const params = new URLSearchParams({
        needsProfile: 'true',
        tempToken: result.tempToken!,
        email: result.email,
        name: result.name,
        ...(result.profileImageUrl && {
          profileImageUrl: result.profileImageUrl,
        }),
      });
      return res.redirect(`${frontendUrl}${callbackPath}?${params.toString()}`);
    } catch {
      const params = new URLSearchParams({
        error: 'true',
        errorCode: ErrorCode.OAUTH_ERROR,
        message: '로그인 처리 중 오류가 발생했습니다.',
      });
      return res.redirect(`${frontendUrl}${callbackPath}?${params.toString()}`);
    }
  }
}
