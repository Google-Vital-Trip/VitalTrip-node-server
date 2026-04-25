import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass1!', description: '현재 비밀번호' })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({
    example: 'NewPass1!',
    description:
      '새 비밀번호 — 대소문자·숫자·특수문자(!@#$%^&*) 각 1자 이상, 8~64자',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message:
      '비밀번호는 대소문자, 숫자, 특수문자(!@#$%^&*)를 각각 하나 이상 포함해야 합니다.',
  })
  newPassword: string;

  @ApiProperty({ example: 'NewPass1!', description: '새 비밀번호 확인' })
  @IsString()
  newPasswordConfirm: string;
}
