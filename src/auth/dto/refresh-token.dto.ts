import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGci...', description: 'Refresh Token' })
  @IsString()
  refreshToken: string;
}
