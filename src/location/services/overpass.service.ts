import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { ErrorCode } from '../../common/constants/error-codes';
import { FacilityType } from '../dto/nearby-query.dto';

export interface NearbyFacility {
  name: string;
  address: string | null;
  phoneNumber: string | null;
  latitude: number;
  longitude: number;
  distance: number;
  openNow: boolean | null;
  openingHours: string[] | null;
  websiteUrl: string | null;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const FACILITY_AMENITY_MAP: Record<FacilityType, string> = {
  [FacilityType.HOSPITAL]: '"amenity"~"hospital|clinic|doctors"',
  [FacilityType.PHARMACY]: '"amenity"="pharmacy"',
  [FacilityType.EMERGENCY]: '"amenity"="hospital"]["emergency"="yes"',
};

@Injectable()
export class OverpassService {
  private readonly logger = new Logger(OverpassService.name);

  async getNearbyFacilities(
    latitude: number,
    longitude: number,
    radius: number,
    type: FacilityType,
    language: string,
  ): Promise<NearbyFacility[]> {
    const amenityFilter = FACILITY_AMENITY_MAP[type];
    const query = `
      [out:json][timeout:25];
      (
        node[${amenityFilter}](around:${radius},${latitude},${longitude});
        way[${amenityFilter}](around:${radius},${latitude},${longitude});
      );
      out body center;
    `;

    let elements: OverpassElement[];
    try {
      const response = await axios.post<{ elements: OverpassElement[] }>(
        OVERPASS_URL,
        `data=${encodeURIComponent(query)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 },
      );
      elements = response.data.elements;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Overpass API 호출 실패 - status: ${error.response?.status}, message: ${error.message}`);
      } else {
        this.logger.error(`Overpass API 호출 실패 - ${String(error)}`);
      }
      throw new ServiceUnavailableException({
        message: '주변 의료시설 검색 서비스를 일시적으로 사용할 수 없습니다.',
        errorCode: ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      });
    }

    return elements
      .filter((el) => el.tags?.name || el.tags?.[`name:${language}`])
      .map((el) => {
        const lat = el.lat ?? el.center?.lat ?? 0;
        const lon = el.lon ?? el.center?.lon ?? 0;
        const tags = el.tags ?? {};

        return {
          name: tags[`name:${language}`] ?? tags.name,
          address: this.buildAddress(tags),
          phoneNumber: tags.phone ?? tags['contact:phone'] ?? null,
          latitude: lat,
          longitude: lon,
          distance: Math.round(this.haversine(latitude, longitude, lat, lon) * 10) / 10,
          openNow: this.isOpenNow(tags.opening_hours),
          openingHours: this.parseOpeningHours(tags.opening_hours),
          websiteUrl: tags.website ?? tags['contact:website'] ?? null,
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  private buildAddress(tags: Record<string, string>): string | null {
    const parts = [
      tags['addr:country'],
      tags['addr:province'] ?? tags['addr:state'],
      tags['addr:city'],
      tags['addr:suburb'],
      tags['addr:street'],
      tags['addr:housenumber'],
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : (tags['addr:full'] ?? null);
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

  private isOpenNow(openingHours?: string): boolean | null {
    if (!openingHours) return null;
    if (openingHours === '24/7') return true;
    return null;
  }

  private parseOpeningHours(openingHours?: string): string[] | null {
    if (!openingHours) return null;
    if (openingHours === '24/7') return ['24시간 연중무휴'];
    return [openingHours];
  }
}
