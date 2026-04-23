import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SymptomType } from '../dto/advice-request.dto';
import { ErrorCode } from '../../common/constants/error-codes';

interface AiAdviceResult {
  content: string;
  summary: string;
  recommendedAction: string;
  disclaimer: string;
  confidence: number;
  blogLinks: string[];
}

const SYSTEM_PROMPT = `You are a certified first-aid assistant for the VitalTrip healthcare travel app.
Provide clear, calm, and actionable first-aid guidance to travelers facing medical emergencies.

LANGUAGE RULE: Detect the language of the user's "symptomDetail" field and respond entirely in that language.
All fields (content, summary, recommendedAction, disclaimer) must be in the same detected language.
Supported languages: Korean, English, Japanese, Chinese, Spanish, French, German, Arabic, Hindi, Russian, and others.

Respond ONLY with a JSON object in this exact format:
{
  "content": "9-10 step first-aid instructions separated by \\n (no numbering, just steps)",
  "summary": "one-sentence core summary",
  "recommendedAction": "the single most urgent action to take right now",
  "disclaimer": "a safety disclaimer note in the detected language",
  "confidence": <integer 0-100>,
  "blogLinks": ["trusted medical URL 1", "trusted medical URL 2", "trusted medical URL 3"]
}

Guidelines:
- content must contain exactly 9-10 steps separated by \\n with no leading numbers or bullets
- confidence reflects how well the provided information supports a reliable response (0-100)
- blogLinks must be real, existing URLs from trusted medical or official health organizations
- If the situation is life-threatening, make calling emergency services the very first step
- disclaimer must warn that this is temporary AI advice and professional medical care is essential`;

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  async getAdvice(
    symptomType: SymptomType,
    symptomDetail: string,
    countryCode: string,
  ): Promise<AiAdviceResult> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `symptomType: ${symptomType}\nsymptomDetail: ${symptomDetail}\ncountryCode: ${countryCode}`,
          },
        ],
        temperature: 0.3,
      });

      const raw = completion.choices[0].message.content ?? '{}';
      return JSON.parse(raw) as AiAdviceResult;
    } catch (error) {
      this.logger.error(`OpenAI 호출 실패: ${(error as Error).message}`);
      throw new InternalServerErrorException({
        message:
          'AI 서비스에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        errorCode: ErrorCode.AI_SERVICE_UNAVAILABLE,
      });
    }
  }
}
