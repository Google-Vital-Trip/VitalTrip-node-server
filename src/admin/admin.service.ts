import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(private readonly usersService: UsersService) {}

  async getUsers(page: number, size: number) {
    const { users, total } = await this.usersService.findAllPaginated(page, size);
    const totalPages = Math.ceil(total / size);

    const content = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      birthDate: u.birthDate,
      countryCode: u.countryCode,
      phoneNumber: u.phoneNumber,
      profileImageUrl: u.profileImageUrl,
      provider: u.provider,
      providerId: u.googleId,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      content,
      page,
      size,
      totalElements: total,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
      hasContent: content.length > 0,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0,
    };
  }

  isAdmin(user: { role: UserRole } | null): boolean {
    return user?.role === UserRole.ADMIN;
  }
}
