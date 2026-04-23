import { Body, Controller, Post } from '@nestjs/common';
import { FirstAidService } from './first-aid.service';
import { AdviceRequestDto } from './dto/advice-request.dto';

@Controller('first-aid')
export class FirstAidController {
  constructor(private readonly firstAidService: FirstAidService) {}

  @Post('advice')
  getAdvice(@Body() dto: AdviceRequestDto) {
    return this.firstAidService.getAdvice(dto);
  }
}
