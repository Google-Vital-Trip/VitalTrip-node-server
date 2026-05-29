import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { ErrorCode } from '../common/constants/error-codes';

@ApiTags('OAuth2')
@Controller('oauth2')
export class OAuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Google OAuth2 로그인 URL 조회' })
  @ApiOkResponse({
    schema: {
      example: {
        message: '성공',
        data: {
          googleLoginUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
        },
      },
    },
  })
  @Get('login-url')
  getLoginUrl() {
    return { googleLoginUrl: this.authService.getGoogleLoginUrl() };
  }

  @ApiOperation({ summary: 'Google 신규 유저 프로필 완성 (회원가입 완료)' })
  @ApiOkResponse({
    schema: {
      example: {
        message: '성공',
        data: {
          accessToken: 'eyJhbGci...',
          refreshToken: 'eyJhbGci...',
          user: { id: 1, email: 'user@example.com', name: '홍길동' },
        },
      },
    },
  })
  @Post('complete-profile')
  @HttpCode(HttpStatus.OK)
  async completeProfile(
    @Headers('authorization') authorization: string,
    @Body() dto: CompleteProfileDto,
  ) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        message: 'tempToken이 없습니다.',
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }
    const tempToken = authorization.slice(7);
    return this.authService.completeGoogleSignup(
      tempToken,
      dto.name,
      dto.birthDate,
      dto.countryCode,
      dto.phoneNumber,
    );
  }
}
