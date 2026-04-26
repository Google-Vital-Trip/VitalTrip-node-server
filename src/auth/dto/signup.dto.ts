import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일 주소' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '홍길동', description: '이름 (1~100자)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'Pass1234!',
    description: '비밀번호 — 영문·숫자·특수문자(!@#$%^&*) 각 1자 이상, 8~64자',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message:
      '비밀번호는 영문, 숫자, 특수문자(!@#$%^&*)를 각각 하나 이상 포함해야 합니다.',
  })
  password: string;

  @ApiProperty({ example: 'Pass1234!', description: '비밀번호 확인' })
  @IsString()
  passwordConfirm: string;

  @ApiProperty({
    example: '2000-01-01',
    description: '생년월일 (ISO 8601, YYYY-MM-DD)',
  })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ example: 'KR', description: '국가 코드 (ISO 3166-1 alpha-2)' })
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  countryCode: string;

  @ApiProperty({
    example: '+821012345678',
    description: '전화번호 (E.164 형식)',
  })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: '올바른 전화번호 형식이 아닙니다.',
  })
  phoneNumber: string;
}
