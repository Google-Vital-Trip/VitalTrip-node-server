import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 37.5665, description: '위도 (-90 ~ 90)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 126.978, description: '경도 (-180 ~ 180)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({
    example: 5000,
    description: '검색 반경 (미터, 500~50000)',
    default: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(500)
  @Max(50000)
  radius: number = 5000;

  @ApiPropertyOptional({
    enum: FacilityType,
    example: FacilityType.HOSPITAL,
    description: '시설 유형',
    default: FacilityType.HOSPITAL,
  })
  @IsOptional()
  @IsEnum(FacilityType)
  type: FacilityType = FacilityType.HOSPITAL;

  @ApiPropertyOptional({
    example: 'ko',
    description: '응답 언어 코드 (BCP 47)',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  language: string = 'en';
}
