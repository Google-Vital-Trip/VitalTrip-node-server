import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: '비밀번호는 대소문자, 숫자, 특수문자(!@#$%^&*)를 각각 하나 이상 포함해야 합니다.',
  })
  newPassword: string;

  @IsString()
  newPasswordConfirm: string;
}
