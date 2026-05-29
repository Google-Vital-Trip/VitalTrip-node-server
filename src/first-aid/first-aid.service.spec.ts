import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FirstAidService } from './first-aid.service';
import { GeocodingService } from './services/geocoding.service';
import { EmergencyContactService } from './services/emergency-contact.service';
import { OpenAiService } from './services/openai.service';
import { SymptomType } from './dto/advice-request.dto';

const mockGeocodingService = { getCountryInfo: jest.fn() };
const mockEmergencyContactService = { getContacts: jest.fn() };
const mockOpenAiService = { getAdvice: jest.fn() };
const mockEventEmitter = { emit: jest.fn() };

const mockAiResult = {
  content: '압박 지혈을 하세요',
  summary: '직접 압박',
  recommendedAction: '119 신고',
  disclaimer: 'AI 조언입니다',
  confidence: 85,
  blogLinks: [],
};

const mockEmergencyContact = { fire: '119', police: '112', medical: '119', general: '112' };

describe('FirstAidService', () => {
  let service: FirstAidService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirstAidService,
        { provide: GeocodingService, useValue: mockGeocodingService },
        { provide: EmergencyContactService, useValue: mockEmergencyContactService },
        { provide: OpenAiService, useValue: mockOpenAiService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<FirstAidService>(FirstAidService);
    jest.clearAllMocks();

    mockGeocodingService.getCountryInfo.mockResolvedValue({ countryCode: 'KR', countryName: 'South Korea' });
    mockEmergencyContactService.getContacts.mockReturnValue(mockEmergencyContact);
    mockOpenAiService.getAdvice.mockResolvedValue(mockAiResult);
  });

  const dto = {
    symptomType: SymptomType.BLEEDING,
    symptomDetail: '손가락에서 피가 많이 납니다.',
    latitude: 37.5665,
    longitude: 126.978,
  };

  it('정상 요청 → 응답 구조 반환', async () => {
    const result = await service.getAdvice(dto);

    expect(result.content).toBe(mockAiResult.content);
    expect(result.identificationResponse.countryCode).toBe('KR');
    expect(result.identificationResponse.emergencyContact).toEqual(mockEmergencyContact);
  });

  it('userId 있음 → 이벤트 payload에 userId 포함', async () => {
    await service.getAdvice(dto, 42);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ userId: 42 }),
    );
  });

  it('userId 없음 → 이벤트 payload에 userId undefined', async () => {
    await service.getAdvice(dto);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ userId: undefined }),
    );
  });

  it('geocoding UNKNOWN 반환 → 정상 응답 (fallback)', async () => {
    mockGeocodingService.getCountryInfo.mockResolvedValue({ countryCode: 'UNKNOWN', countryName: 'Unknown' });

    const result = await service.getAdvice(dto);

    expect(result.identificationResponse.countryCode).toBe('UNKNOWN');
    expect(result.content).toBeTruthy();
  });

  it('이벤트는 fire-and-forget (await 없이 emit 호출)', async () => {
    await service.getAdvice(dto);

    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
  });
});
