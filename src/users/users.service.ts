import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    email: string;
    name: string;
    password: string;
    birthDate: string;
    countryCode: string;
    phoneNumber: string;
  }) {
    try {
      return await this.prisma.user.create({ data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({
          message: '이미 사용 중인 이메일입니다.',
          errorCode: ErrorCode.EMAIL_ALREADY_EXISTS,
        });
      }
      throw e;
    }
  }

  async findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdWithRefreshToken(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdWithPassword(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        googleId: true,
        birthDate: true,
        countryCode: true,
        phoneNumber: true,
        profileImageUrl: true,
        provider: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateRefreshToken(id: number, refreshToken: string | null) {
    await this.prisma.user.update({ where: { id }, data: { refreshToken } });
  }

  async updatePassword(id: number, hashedPassword: string) {
    await this.prisma.user.update({ where: { id }, data: { password: hashedPassword } });
  }

  async existsByEmail(email: string) {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        googleId: true,
        birthDate: true,
        countryCode: true,
        phoneNumber: true,
        profileImageUrl: true,
        provider: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({
      where: { googleId },
      select: {
        id: true,
        email: true,
        name: true,
        googleId: true,
        birthDate: true,
        countryCode: true,
        phoneNumber: true,
        profileImageUrl: true,
        provider: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createGoogleUser(data: {
    email: string;
    name: string;
    googleId: string;
    profileImageUrl: string | null;
    birthDate: string;
    countryCode: string;
    phoneNumber: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException({
        message: '이미 사용 중인 이메일입니다.',
        errorCode: ErrorCode.EMAIL_ALREADY_EXISTS,
      });
    }
    return this.prisma.user.create({
      data: { ...data, password: null, provider: Provider.GOOGLE },
    });
  }

  async updateProfile(
    id: number,
    data: { name: string; birthDate: string; countryCode: string; phoneNumber: string },
  ) {
    await this.prisma.user.update({ where: { id }, data });
  }

  async findAllPaginated(page: number, size: number) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: page * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          googleId: true,
          birthDate: true,
          countryCode: true,
          phoneNumber: true,
          profileImageUrl: true,
          provider: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total };
  }
}
