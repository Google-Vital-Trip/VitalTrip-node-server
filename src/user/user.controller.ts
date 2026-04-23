import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: { user: { id: number } }) {
    return this.usersService.findById(req.user.id);
  }

  @Put('profile')
  async updateProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateProfileDto,
  ) {
    await this.usersService.updateProfile(req.user.id, dto);
  }
}
