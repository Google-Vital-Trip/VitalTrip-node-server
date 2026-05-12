import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class GoogleSignupDto {
  @ApiProperty({ example: 'eyJhbGci...', description: 'Google 콜백에서 받은 tempToken (10분 유효)' })
  @IsString()
  tempToken: string;

  @ApiProperty({ example: '2000-01-01', description: '생년월일 (YYYY-MM-DD)' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ example: 'KR', description: '국가 코드 (ISO 3166-1 alpha-2)' })
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  countryCode: string;

  @ApiProperty({ example: '+821012345678', description: '전화번호 (E.164 형식)' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: '올바른 전화번호 형식이 아닙니다.' })
  phoneNumber: string;
}
