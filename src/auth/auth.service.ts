import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ErrorCode } from '../common/constants/error-codes';

const SALT_ROUNDS = 12;
const DUMMY_HASH =
  '$2b$12$invalidhashpadding00000000000000000000000000000000000000';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<void> {
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException({
        message: '비밀번호가 일치하지 않습니다.',
        errorCode: ErrorCode.VALIDATION_FAILED,
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await this.usersService.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      birthDate: dto.birthDate,
      countryCode: dto.countryCode,
      phoneNumber: dto.phoneNumber,
    });
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
    );
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: number; email: string };

    try {
      payload = this.jwtService.verify<{ sub: number; email: string }>(
        refreshToken,
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException({
        message: '유효하지 않은 리프레시 토큰입니다.',
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException({
        message: '유효하지 않은 리프레시 토큰입니다.',
        errorCode: ErrorCode.UNAUTHORIZED,
      });
    }

    const { accessToken } = this.generateTokens(user.id, user.email);
    return { accessToken };
  }

  async checkEmail(email: string): Promise<{ available: boolean }> {
    const exists = await this.usersService.existsByEmail(email);
    return { available: !exists };
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new BadRequestException({
        message: '새 비밀번호가 일치하지 않습니다.',
        errorCode: ErrorCode.VALIDATION_FAILED,
      });
    }

    const user = await this.usersService.findByIdWithPassword(userId);

    const isValid = await bcrypt.compare(dto.currentPassword, user!.password);
    if (!isValid) {
      throw new UnauthorizedException({
        message: '현재 비밀번호가 올바르지 않습니다.',
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    const hashed = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersService.updatePassword(userId, hashed);
  }

  private generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '30d',
      ) as never,
    });
    return { accessToken, refreshToken };
  }
}
