import { Injectable } from '@nestjs/common';
import { AdviceRequestDto } from './dto/advice-request.dto';
import { GeocodingService } from './services/geocoding.service';
import { EmergencyContactService } from './services/emergency-contact.service';
import { OpenAiService } from './services/openai.service';

@Injectable()
export class FirstAidService {
  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly emergencyContactService: EmergencyContactService,
    private readonly openAiService: OpenAiService,
  ) {}

  async getAdvice(dto: AdviceRequestDto) {
    const { symptomType, symptomDetail, latitude, longitude } = dto;

    const { countryCode, countryName } =
      await this.geocodingService.getCountryInfo(latitude, longitude);

    const [emergencyContact, aiResult] = await Promise.all([
      Promise.resolve(this.emergencyContactService.getContacts(countryCode)),
      this.openAiService.getAdvice(symptomType, symptomDetail, countryCode),
    ]);

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
