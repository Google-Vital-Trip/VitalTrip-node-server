import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일 주소' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Pass1234!', description: '비밀번호' })
  @IsString()
  @MinLength(1)
  password: string;
}
