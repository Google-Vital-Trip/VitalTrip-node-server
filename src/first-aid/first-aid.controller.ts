import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FirstAidService } from './first-aid.service';
import { AdviceRequestDto } from './dto/advice-request.dto';

@ApiTags('First Aid')
@Controller('first-aid')
export class FirstAidController {
  constructor(private readonly firstAidService: FirstAidService) {}

  @ApiOperation({ summary: '응급처치 AI 조언 요청 (인증 불필요)' })
  @ApiOkResponse({
    description: 'AI 응급처치 조언 및 현지 응급연락처',
    schema: {
      example: {
        message: '성공',
        data: {
          content: '출혈 부위를 깨끗한 천으로 압박하세요...',
          summary: '직접 압박으로 출혈을 멈추세요.',
          recommendedAction: '119에 즉시 신고하세요.',
          identificationResponse: {
            countryCode: 'KR',
            countryName: 'South Korea',
            latitude: 37.5665,
            longitude: 126.9780,
            emergencyContact: { police: '112', fire: '119', ambulance: '119' },
          },
          disclaimer: '본 정보는 참고용이며 전문 의료 조언을 대체하지 않습니다.',
          confidence: 0.92,
          blogLinks: ['https://example.com/first-aid-bleeding'],
        },
      },
    },
  })
  @Post('advice')
  getAdvice(@Body() dto: AdviceRequestDto) {
    return this.firstAidService.getAdvice(dto);
  }
}
