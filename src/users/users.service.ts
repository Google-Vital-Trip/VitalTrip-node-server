import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Provider, User } from './entities/user.entity';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: {
    email: string;
    name: string;
    password: string;
    birthDate: string;
    countryCode: string;
    phoneNumber: string;
  }): Promise<User> {
    const user = this.usersRepository.create(data);
    try {
      return await this.usersRepository.save(user);
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e as QueryFailedError & { code: string }).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException({
          message: '이미 사용 중인 이메일입니다.',
          errorCode: ErrorCode.EMAIL_ALREADY_EXISTS,
        });
      }
      throw e;
    }
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByIdWithRefreshToken(id: number): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByIdWithPassword(id: number): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateRefreshToken(
    id: number,
    refreshToken: string | null,
  ): Promise<void> {
    await this.usersRepository.update(id, { refreshToken });
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, { password: hashedPassword });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.usersRepository.existsBy({ email });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async createGoogleUser(data: {
    email: string;
    name: string;
    googleId: string;
    profileImageUrl: string | null;
    birthDate: string;
    countryCode: string;
    phoneNumber: string;
  }): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException({
        message: '이미 사용 중인 이메일입니다.',
        errorCode: ErrorCode.EMAIL_ALREADY_EXISTS,
      });
    }
    const user = this.usersRepository.create({
      ...data,
      password: null,
      provider: Provider.GOOGLE,
    });
    return this.usersRepository.save(user);
  }

  async updateProfile(
    id: number,
    data: {
      name: string;
      birthDate: string;
      countryCode: string;
      phoneNumber: string;
    },
  ): Promise<void> {
    await this.usersRepository.update(id, data);
  }

  async findAllPaginated(
    page: number,
    size: number,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      skip: page * size,
      take: size,
      order: { createdAt: 'DESC' },
    });
    return { users, total };
  }
}
