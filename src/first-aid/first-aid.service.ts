import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdviceRequestDto } from './dto/advice-request.dto';
import { GeocodingService } from './services/geocoding.service';
import { EmergencyContactService } from './services/emergency-contact.service';
import { OpenAiService } from './services/openai.service';
import {
  FIRST_AID_ADVICE_COMPLETED,
  FirstAidAdviceCompletedEvent,
} from './events/first-aid.events';

@Injectable()
export class FirstAidService {
  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly emergencyContactService: EmergencyContactService,
    private readonly openAiService: OpenAiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAdvice(dto: AdviceRequestDto, userId?: number) {
    const { symptomType, symptomDetail, latitude, longitude } = dto;

    const { countryCode, countryName } =
      await this.geocodingService.getCountryInfo(latitude, longitude);

    const [emergencyContact, aiResult] = await Promise.all([
      Promise.resolve(this.emergencyContactService.getContacts(countryCode)),
      this.openAiService.getAdvice(symptomType, symptomDetail, countryCode),
    ]);

    const event = new FirstAidAdviceCompletedEvent();
    event.userId = userId;
    event.symptomType = symptomType;
    event.countryCode = countryCode;
    event.confidence = aiResult.confidence;
    this.eventEmitter.emit(FIRST_AID_ADVICE_COMPLETED, event);

    return {
      content: aiResult.content,
      summary: aiResult.summary,
      recommendedAction: aiResult.recommendedAction,
      identificationResponse: {
        countryCode,
        countryName,
        latitude,
        longitude,
        emergencyContact,
      },
      disclaimer: aiResult.disclaimer,
      confidence: aiResult.confidence,
      blogLinks: aiResult.blogLinks,
    };
  }
}
