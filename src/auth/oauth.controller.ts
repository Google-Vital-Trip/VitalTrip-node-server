import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

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
}
