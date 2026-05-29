import { SymptomType } from '../dto/advice-request.dto';

export const FIRST_AID_ADVICE_COMPLETED = 'first-aid.advice.completed';

export class FirstAidAdviceCompletedEvent {
  userId?: number;
  symptomType: SymptomType;
  countryCode: string;
  confidence: number;
}
