import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class IdentifyCountryDto {
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
