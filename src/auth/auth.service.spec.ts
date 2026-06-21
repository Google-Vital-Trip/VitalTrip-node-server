import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('axios');
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockUsersService = {
  create: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findByIdWithRefreshToken: jest.fn(),
  findByIdWithPassword: jest.fn(),
  findByEmail: jest.fn(),
  findByGoogleId: jest.fn(),
  findByAppleId: jest.fn(),
  existsByEmail: jest.fn(),
  updateRefreshToken: jest.fn(),
  updatePassword: jest.fn(),
  createGoogleUser: jest.fn(),
  createAppleUser: jest.fn(),
  linkGoogleId: jest.fn(),
  linkAppleId: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '30d',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_CALLBACK_URL: 'http://localhost:3000/callback',
    };
    return config[key];
  }),
};

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: '$2b$12$hashedpassword',
  role: UserRole.USER,
  provider: 'LOCAL',
  refreshToken: '$2b$12$hashedrefresh',
  googleId: null,
  appleId: null,
  birthDate: '1990-01-01',
  countryCode: 'KR',
  phoneNumber: '+821012345678',
  profileImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock.token');
  });

  describe('signup', () => {
    const dto = {
      email: 'test@example.com',
      name: 'Test',
      password: 'Password1!',
      passwordConfirm: 'Password1!',
      birthDate: '1990-01-01',
      countryCode: 'KR',
      phoneNumber: '+821012345678',
    };

    it('정상 회원가입 → bcrypt 해시 후 create 호출', async () => {
      mockedBcrypt.hash.mockResolvedValue('hashed' as never);
      mockUsersService.create.mockResolvedValue(mockUser);

      await service.signup(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email, password: 'hashed' }),
      );
    });

    it('비밀번호 불일치 → BadRequestException', async () => {
      await expect(
        service.signup({ ...dto, passwordConfirm: 'WrongPass1!' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('정상 로그인 → accessToken/refreshToken 반환', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login('test@example.com', 'Password1!');

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user.email).toBe('test@example.com');
    });

    it('존재하지 않는 이메일 → NotFoundException', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login('none@example.com', 'Password1!'),
      ).rejects.toThrow(NotFoundException);
    });

    it('소셜 로그인 계정(password null) → BadRequestException', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        password: null,
      });

      await expect(
        service.login('test@example.com', 'Password1!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('잘못된 비밀번호 → UnauthorizedException', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login('test@example.com', 'WrongPass!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('refreshToken null로 업데이트', async () => {
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.logout(1);

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(1, null);
    });
  });

  describe('refresh', () => {
    it('유효한 토큰 → 새 토큰 반환 및 rotation', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 1,
        email: 'test@example.com',
      });
      mockUsersService.findByIdWithRefreshToken.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refresh('valid.refresh.token');

      expect(result.accessToken).toBeTruthy();
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalled();
    });

    it('JWT 검증 실패 → UnauthorizedException', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refresh('bad.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('refreshToken bcrypt 불일치 → UnauthorizedException', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 1,
        email: 'test@example.com',
      });
      mockUsersService.findByIdWithRefreshToken.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.refresh('wrong.refresh.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('checkEmail', () => {
    it('미존재 이메일 → available: true', async () => {
      mockUsersService.existsByEmail.mockResolvedValue(false);
      expect((await service.checkEmail('new@example.com')).available).toBe(
        true,
      );
    });

    it('존재 이메일 → available: false', async () => {
      mockUsersService.existsByEmail.mockResolvedValue(true);
      expect((await service.checkEmail('existing@example.com')).available).toBe(
        false,
      );
    });
  });

  describe('changePassword', () => {
    const dto = {
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      newPasswordConfirm: 'NewPass1!',
    };

    it('정상 변경', async () => {
      mockUsersService.findByIdWithPassword.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('newHashed' as never);
      mockUsersService.updatePassword.mockResolvedValue(undefined);

      await service.changePassword(1, dto);

      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        1,
        'newHashed',
      );
    });

    it('새 비밀번호 불일치 → BadRequestException', async () => {
      await expect(
        service.changePassword(1, { ...dto, newPasswordConfirm: 'DiffPass1!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('소셜 로그인 계정 → BadRequestException', async () => {
      mockUsersService.findByIdWithPassword.mockResolvedValue({
        ...mockUser,
        password: null,
      });

      await expect(service.changePassword(1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('현재 비밀번호 불일치 → UnauthorizedException', async () => {
      mockUsersService.findByIdWithPassword.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.changePassword(1, dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('adminLogin', () => {
    it('정상 관리자 로그인', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      mockUsersService.findByEmailWithPassword.mockResolvedValue(adminUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.adminLogin(
        'admin@example.com',
        'AdminPass1!',
      );

      expect(result.accessToken).toBeTruthy();
    });

    it('유저 없음 → DUMMY_HASH 비교 실행 후 UnauthorizedException', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(null);
      const compareSpy = mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.adminLogin('none@example.com', 'Pass1!'),
      ).rejects.toThrow(UnauthorizedException);
      expect(compareSpy).toHaveBeenCalled();
    });

    it('ADMIN 아닌 사용자 → ForbiddenException', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(
        service.adminLogin('test@example.com', 'Pass1!'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('소셜 로그인 계정 → UnauthorizedException', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        password: null,
      });

      await expect(
        service.adminLogin('test@example.com', 'Pass1!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('appleLogin', () => {
    it('기존 Apple ID 유저 → isNewUser: false', async () => {
      mockUsersService.findByAppleId.mockResolvedValue(mockUser);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.appleLogin('apple123', null, null);

      expect(result.isNewUser).toBe(false);
    });

    it('기존 이메일 유저 → Apple ID 연동 후 isNewUser: false', async () => {
      mockUsersService.findByAppleId.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.linkAppleId.mockResolvedValue(undefined);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.appleLogin(
        'apple123',
        'test@example.com',
        'Test',
      );

      expect(mockUsersService.linkAppleId).toHaveBeenCalledWith(1, 'apple123');
      expect(result.isNewUser).toBe(false);
    });

    it('신규 유저 → 생성 후 isNewUser: true', async () => {
      mockUsersService.findByAppleId.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createAppleUser.mockResolvedValue(mockUser);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.appleLogin(
        'apple123',
        'new@example.com',
        'New User',
      );

      expect(result.isNewUser).toBe(true);
    });

    it('최초 로그인에 email/name 없음 → BadRequestException', async () => {
      mockUsersService.findByAppleId.mockResolvedValue(null);

      await expect(service.appleLogin('apple123', null, null)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
