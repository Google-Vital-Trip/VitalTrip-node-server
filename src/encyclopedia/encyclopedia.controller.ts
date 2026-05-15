import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EncyclopediaService } from './encyclopedia.service';
import { EncyclopediaQueryDto } from './dto/encyclopedia-query.dto';

@ApiTags('Encyclopedia')
@Controller('encyclopedia')
export class EncyclopediaController {
  constructor(private readonly encyclopediaService: EncyclopediaService) {}

  @ApiOperation({ summary: '건강 백과사전 목록 (MedlinePlus 데이터, 인증 불필요)' })
  @ApiOkResponse({
    description: '질병·증상·응급처치 건강 주제 목록',
    schema: {
      example: {
        message: '성공',
        data: {
          total: 500,
          items: [
            {
              id: 1,
              title: 'Burns',
              altTitles: ['Chemical Burns', 'Thermal Burns'],
              summary: 'Burns are injuries to skin or other tissue caused by heat...',
              categories: ['Injuries and Wounds'],
              url: 'https://medlineplus.gov/burns.html',
            },
          ],
        },
      },
    },
  })
  @Get()
  getTopics(@Query() query: EncyclopediaQueryDto) {
    return this.encyclopediaService.getTopics(query.search, query.offset, query.limit);
  }
}
