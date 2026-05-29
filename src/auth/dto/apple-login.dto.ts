import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AppleLoginDto {
  @ApiProperty({ description: 'Apple unique user ID (sub claim)' })
  @IsString()
  appleId: string;

  @ApiProperty({
    description: '이메일 (최초 로그인 시에만 제공)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  email: string | null;

  @ApiProperty({
    description: '이름 (최초 로그인 시에만 제공)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  name: string | null;
}
