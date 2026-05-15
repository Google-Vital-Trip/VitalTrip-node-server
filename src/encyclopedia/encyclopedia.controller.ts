import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EncyclopediaService } from './encyclopedia.service';
import { EncyclopediaQueryDto } from './dto/encyclopedia-query.dto';

@ApiTags('Encyclopedia')
@Controller('encyclopedia')
export class EncyclopediaController {
  constructor(private readonly encyclopediaService: EncyclopediaService) {}

  @ApiOperation({ summary: '응급처치 백과사전 목록 (NIH 데이터, 인증 불필요)' })
  @ApiOkResponse({
    description: '의학 증상/질환 목록',
    schema: {
      example: {
        message: '성공',
        data: {
          total: 500,
          items: [{ id: 'condition-0', name: 'Burn', icdCodes: ['T30'] }],
        },
      },
    },
  })
  @Get()
  getConditions(@Query() query: EncyclopediaQueryDto) {
    return this.encyclopediaService.getConditions(query.search);
  }
}
