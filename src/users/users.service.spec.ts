import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed',
  provider: Provider.LOCAL,
  role: 'USER',
  refreshToken: 'hashed_refresh',
  googleId: null,
  appleId: null,
  birthDate: '1990-01-01',
  countryCode: 'KR',
  phoneNumber: '+821012345678',
  profileImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const data = {
      email: 'test@example.com',
      name: 'Test',
      password: 'hashed',
      birthDate: '1990-01-01',
      countryCode: 'KR',
      phoneNumber: '+821012345678',
    };

    it('정상 생성', async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(data);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data });
    });

    it('이메일 중복(P2002) → ConflictException', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('', {
        code: 'P2002',
        clientVersion: '5.0',
      });
      mockPrisma.user.create.mockRejectedValue(prismaError);

      await expect(service.create(data)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRefreshToken', () => {
    it('token 있음 → bcrypt 해시 후 저장', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await service.updateRefreshToken(1, 'raw_token');

      const calls = mockPrisma.user.update.mock.calls as Array<
        [{ data: { refreshToken: string } }]
      >;
      expect(calls[0][0].data.refreshToken).not.toBe('raw_token');
      expect(calls[0][0].data.refreshToken).toBeTruthy();
    });

    it('null → bcrypt 없이 null 저장', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await service.updateRefreshToken(1, null);

      const calls = mockPrisma.user.update.mock.calls as Array<
        [{ data: { refreshToken: null } }]
      >;
      expect(calls[0][0].data.refreshToken).toBeNull();
    });
  });

  describe('existsByEmail', () => {
    it('존재 → true', async () => {
      mockPrisma.user.count.mockResolvedValue(1);
      expect(await service.existsByEmail('test@example.com')).toBe(true);
    });

    it('미존재 → false', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      expect(await service.existsByEmail('none@example.com')).toBe(false);
    });
  });

  describe('createGoogleUser', () => {
    it('provider: GOOGLE, password: null 로 생성', async () => {
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        provider: Provider.GOOGLE,
        password: null,
      });

      await service.createGoogleUser({
        email: 'test@example.com',
        name: 'Test',
        googleId: 'google123',
        profileImageUrl: null,
        birthDate: '1990-01-01',
        countryCode: 'KR',
        phoneNumber: '+821012345678',
      });

      const calls = mockPrisma.user.create.mock.calls as Array<
        [{ data: { provider: Provider; password: null } }]
      >;
      expect(calls[0][0].data.provider).toBe(Provider.GOOGLE);
      expect(calls[0][0].data.password).toBeNull();
    });
  });

  describe('createAppleUser', () => {
    it('provider: APPLE, password: null 로 생성', async () => {
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        provider: Provider.APPLE,
        password: null,
      });

      await service.createAppleUser({
        appleId: 'apple123',
        email: 'test@example.com',
        name: 'Test',
      });

      const calls = mockPrisma.user.create.mock.calls as Array<
        [{ data: { provider: Provider; password: null } }]
      >;
      expect(calls[0][0].data.provider).toBe(Provider.APPLE);
      expect(calls[0][0].data.password).toBeNull();
    });
  });

  describe('findAllPaginated', () => {
    it('$transaction으로 users/total 동시 조회', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAllPaginated(0, 10);

      expect(result.total).toBe(1);
      expect(result.users).toHaveLength(1);
    });
  });
});
