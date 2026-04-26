import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum SymptomType {
  BLEEDING = 'BLEEDING',
  BURNS = 'BURNS',
  FRACTURE = 'FRACTURE',
  ALLERGIC_REACTION = 'ALLERGIC_REACTION',
  SEIZURE = 'SEIZURE',
  HEATSTROKE = 'HEATSTROKE',
  HYPOTHERMIA = 'HYPOTHERMIA',
  POISONING = 'POISONING',
  BREATHING_DIFFICULTY = 'BREATHING_DIFFICULTY',
  ANIMAL_BITE = 'ANIMAL_BITE',
  FALL_INJURY = 'FALL_INJURY',
}

export class AdviceRequestDto {
  @ApiProperty({
    enum: SymptomType,
    example: SymptomType.BLEEDING,
    description: '증상 유형',
  })
  @IsEnum(SymptomType)
  symptomType: SymptomType;

  @ApiProperty({
    example: '오른쪽 손목에서 출혈이 심하게 발생하고 있습니다.',
    description: '증상 상세 설명 (10~2000자)',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  symptomDetail: string;

  @ApiProperty({ example: 37.5665, description: '위도 (-90 ~ 90)' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 126.978, description: '경도 (-180 ~ 180)' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
