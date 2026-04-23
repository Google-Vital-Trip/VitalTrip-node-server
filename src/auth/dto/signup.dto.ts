import {
  IsDateString,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: '비밀번호는 대소문자, 숫자, 특수문자(!@#$%^&*)를 각각 하나 이상 포함해야 합니다.',
  })
  password: string;

  @IsString()
  passwordConfirm: string;

  @IsDateString()
  birthDate: string;

  @IsString()
  @MinLength(2)
  @MaxLength(10)
  countryCode: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: '올바른 전화번호 형식이 아닙니다.' })
  phoneNumber: string;
}
