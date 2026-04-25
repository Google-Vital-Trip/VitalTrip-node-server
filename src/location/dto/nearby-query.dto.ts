import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum FacilityType {
  HOSPITAL = 'hospital',
  PHARMACY = 'pharmacy',
  EMERGENCY = 'emergency',
}

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(500)
  @Max(50000)
  radius: number = 5000;

  @IsOptional()
  @IsEnum(FacilityType)
  type: FacilityType = FacilityType.HOSPITAL;

  @IsOptional()
  @IsString()
  language: string = 'en';
}
