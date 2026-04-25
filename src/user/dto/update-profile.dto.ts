import {
  IsDateString,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsDateString()
  birthDate: string;

  @IsString()
  @MinLength(2)
  @MaxLength(10)
  countryCode: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: '올바른 전화번호 형식이 아닙니다.',
  })
  phoneNumber: string;
}
