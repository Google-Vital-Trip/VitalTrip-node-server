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

const SYSTEM_PROMPT = `You are an emergency medical expert providing first-aid guidance for travelers.

LANGUAGE DETECTION — use grammar patterns, NOT medical terms:
"I got burned on my hand" → English (I, got, on my)
"Me quemé en la mano" → Spanish (Me quemé, en la)
"뜨거운 물에 손을 데었어요" → Korean (뜨거운, 데었어요)
"J'ai été brûlé par de l'eau chaude" → French (J'ai été, par de)
Respond ENTIRELY in the detected language — never mix languages. ALL sections must be in the same language.

Respond ONLY with a JSON object:
{
  "content": "exactly 9-10 first-aid steps separated by \\n, no numbers or bullets",
  "summary": "1-2 sentence overview",
  "recommendedAction": "single most urgent action right now",
  "disclaimer": "AI advice only — not professional diagnosis; seek immediate professional care; call emergency services",
  "confidence": <integer 0-100>,
  "blogLinks": ["trusted medical URL 1", "trusted medical URL 2", "trusted medical URL 3"]
}

Rules:
- content: exactly 9-10 plain-text lines separated by \\n, no leading numbers or bullets
- If life-threatening, make calling emergency services the first step
- blogLinks must be real URLs from trusted medical/health organizations
- confidence: how reliably the provided info supports a good response (0-100)`;

const SYMPTOM_PROMPTS: Record<SymptomType, string> = {
  [SymptomType.BLEEDING]:
    'Focus on controlling bleeding via direct pressure, elevation, and pressure points. Include severity assessment and shock prevention.',
  [SymptomType.BURNS]:
    'Focus on cooling the burn, preventing infection, and determining burn degree. Include removing from heat source and protecting the area.',
  [SymptomType.FRACTURE]:
    'Focus on immobilization and preventing further injury. Include splinting technique and supporting the injured area.',
  [SymptomType.ALLERGIC_REACTION]:
    'Focus on identifying and removing the allergen, managing symptoms. Include severe-reaction steps and when to use epinephrine.',
  [SymptomType.SEIZURE]:
    'Focus on protecting the person during the seizure and recovery position. Include timing the seizure and when to call emergency services.',
  [SymptomType.HEATSTROKE]:
    'Focus on rapid cooling and moving to shade/cool environment. Include monitoring consciousness and preventing shock.',
  [SymptomType.HYPOTHERMIA]:
    'Focus on gradual warming and preventing heat loss. Include proper positioning and avoiding rapid rewarming.',
  [SymptomType.POISONING]:
    'Focus on identifying the poison and appropriate decontamination. Include when NOT to induce vomiting and calling poison control.',
  [SymptomType.BREATHING_DIFFICULTY]:
    'Focus on positioning for easier breathing and clearing airways. Include recognizing severe respiratory distress.',
  [SymptomType.ANIMAL_BITE]:
    'Focus on wound cleaning, bleeding control, and infection prevention. Include rabies considerations and when to seek immediate care.',
  [SymptomType.FALL_INJURY]:
    'Focus on spinal injury precautions and assessing for fractures. Include when to move the person and head injury signs.',
};

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
            content: [
              `symptomType: ${symptomType}`,
              `symptomDetail: ${symptomDetail}`,
              `countryCode: ${countryCode}`,
              `additionalGuidance: ${SYMPTOM_PROMPTS[symptomType]}`,
            ].join('\n'),
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
