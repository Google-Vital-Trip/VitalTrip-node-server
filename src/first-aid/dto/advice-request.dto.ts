import { IsEnum, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export enum SymptomType {
  BLEEDING = 'BLEEDING',
  FRACTURE = 'FRACTURE',
  BURN = 'BURN',
  CHOKING = 'CHOKING',
  CARDIAC_ARREST = 'CARDIAC_ARREST',
  ALLERGIC_REACTION = 'ALLERGIC_REACTION',
  HEAD_INJURY = 'HEAD_INJURY',
  POISONING = 'POISONING',
  SEIZURE = 'SEIZURE',
  OTHER = 'OTHER',
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
