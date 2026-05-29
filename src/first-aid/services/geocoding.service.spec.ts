import { GeocodingService } from './geocoding.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GeocodingService', () => {
  let service: GeocodingService;

  beforeEach(() => {
    service = new GeocodingService();
    jest.clearAllMocks();
  });

  it('정상 응답 → countryCode/countryName 반환', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { countryCode: 'KR', countryName: 'South Korea' },
    });

    const result = await service.getCountryInfo(37.5665, 126.978);

    expect(result.countryCode).toBe('KR');
    expect(result.countryName).toBe('South Korea');
  });

  it('countryCode 없는 응답 → UNKNOWN fallback', async () => {
    mockedAxios.get.mockResolvedValue({ data: {} });

    const result = await service.getCountryInfo(0, 0);

    expect(result.countryCode).toBe('UNKNOWN');
    expect(result.countryName).toBe('Unknown');
  });

  it('axios 실패 → 예외 없이 UNKNOWN 반환', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    const result = await service.getCountryInfo(37.5665, 126.978);

    expect(result.countryCode).toBe('UNKNOWN');
    expect(result.countryName).toBe('Unknown');
  });
});
