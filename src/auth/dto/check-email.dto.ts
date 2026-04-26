import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CheckEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '중복 확인할 이메일',
  })
  @IsEmail()
  email: string;
}
