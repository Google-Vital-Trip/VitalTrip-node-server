import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FIRST_AID_ADVICE_COMPLETED,
  FirstAidAdviceCompletedEvent,
} from '../events/first-aid.events';

@Injectable()
export class FirstAidLogListener {
  private readonly logger = new Logger(FirstAidLogListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(FIRST_AID_ADVICE_COMPLETED)
  async handleAdviceCompleted(event: FirstAidAdviceCompletedEvent) {
    try {
      await this.prisma.firstAidLog.create({
        data: {
          userId: event.userId ?? null,
          symptomType: event.symptomType,
          countryCode: event.countryCode,
          confidence: event.confidence,
        },
      });
    } catch (err) {
      this.logger.error('first-aid 로그 저장 실패', err);
    }
  }
}
