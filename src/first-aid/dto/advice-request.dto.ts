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
  @IsEnum(SymptomType)
  symptomType: SymptomType;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  symptomDetail: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
