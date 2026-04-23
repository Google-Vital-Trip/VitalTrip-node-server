import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface GeocodingResult {
  countryCode: string;
  countryName: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async getCountryInfo(
    latitude: number,
    longitude: number,
  ): Promise<GeocodingResult> {
    try {
      const { data } = await axios.get(
        'https://api.bigdatacloud.net/data/reverse-geocode-client',
        {
          params: { latitude, longitude, localityLanguage: 'en' },
          timeout: 5000,
        },
      );

      const countryCode = (data.countryCode as string | undefined) ?? 'UNKNOWN';
      const countryName = (data.countryName as string | undefined) ?? 'Unknown';

      return { countryCode, countryName };
    } catch (error) {
      this.logger.warn(
        `Geocoding 실패 (${latitude}, ${longitude}): ${(error as Error).message}`,
      );
      return { countryCode: 'UNKNOWN', countryName: 'Unknown' };
    }
  }
}
