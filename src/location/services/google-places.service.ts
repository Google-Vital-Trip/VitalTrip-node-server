import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { ErrorCode } from '../../common/constants/error-codes';
import { FacilityType } from '../dto/nearby-query.dto';
import { NearbyFacility } from './overpass.service';

const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby';

const FACILITY_TYPES: Record<FacilityType, string[]> = {
  [FacilityType.HOSPITAL]: ['hospital', 'doctor'],
  [FacilityType.PHARMACY]: ['pharmacy'],
  [FacilityType.EMERGENCY]: ['hospital'],
};

const FIELD_MASK = [
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.location',
  'places.regularOpeningHours',
  'places.websiteUri',
].join(',');

const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly cache = new Map<string, { data: NearbyFacility[]; expiresAt: number }>();

  async getNearbyFacilities(
    latitude: number,
    longitude: number,
    radius: number,
    type: FacilityType,
    language: string,
  ): Promise<NearbyFacility[]> {
    const cacheKey = `${type}:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${radius}:${language}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException({
        message: '주변 의료시설 검색 서비스를 일시적으로 사용할 수 없습니다.',
        errorCode: ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      });
    }

    try {
      const response = await axios.post(
        GOOGLE_PLACES_URL,
        {
          includedTypes: FACILITY_TYPES[type],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude, longitude },
              radius: Number(radius),
            },
          },
          languageCode: language,
        },
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': FIELD_MASK,
          },
          timeout: 10000,
        },
      );

      const places: GooglePlace[] = response.data.places ?? [];
      const result: NearbyFacility[] = places
        .map((place) => ({
          name: place.displayName?.text ?? '',
          address: place.formattedAddress ?? null,
          phoneNumber: place.nationalPhoneNumber ?? null,
          latitude: place.location.latitude,
          longitude: place.location.longitude,
          distance:
            Math.round(
              this.haversine(latitude, longitude, place.location.latitude, place.location.longitude) * 10,
            ) / 10,
          openNow: place.regularOpeningHours?.openNow ?? null,
          openingHours: place.regularOpeningHours?.weekdayDescriptions ?? null,
          websiteUrl: place.websiteUri ?? null,
        }))
        .sort((a, b) => a.distance - b.distance);

      this.cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch (error) {
      this.logger.error(
        'Google Places API 호출 실패',
        error instanceof Error ? error.message : String(error),
      );
      throw new ServiceUnavailableException({
        message: '주변 의료시설 검색 서비스를 일시적으로 사용할 수 없습니다.',
        errorCode: ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      });
    }
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

interface GooglePlace {
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  location: { latitude: number; longitude: number };
  regularOpeningHours?: { openNow: boolean; weekdayDescriptions: string[] };
  websiteUri?: string;
}
