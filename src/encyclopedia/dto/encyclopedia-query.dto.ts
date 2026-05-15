import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EncyclopediaQueryDto {
  @ApiPropertyOptional({ example: 'burn', description: '검색 키워드' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
