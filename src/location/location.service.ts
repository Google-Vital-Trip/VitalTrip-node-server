import { Injectable } from '@nestjs/common';
import { GeocodingService } from '../first-aid/services/geocoding.service';
import { EmergencyContactService } from '../first-aid/services/emergency-contact.service';
import { OverpassService } from './services/overpass.service';
import { FacilityType } from './dto/nearby-query.dto';

@Injectable()
export class LocationService {
  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly emergencyContactService: EmergencyContactService,
    private readonly overpassService: OverpassService,
  ) {}

  async identifyCountry(latitude: number, longitude: number) {
    const { countryCode, countryName } = await this.geocodingService.getCountryInfo(
      latitude,
      longitude,
    );
    const emergencyContact = this.emergencyContactService.getContacts(countryCode);

    return { countryCode, countryName, latitude, longitude, emergencyContact };
  }

  async getNearbyFacilities(
    latitude: number,
    longitude: number,
    radius: number,
    type: FacilityType,
    language: string,
  ) {
    return this.overpassService.getNearbyFacilities(latitude, longitude, radius, type, language);
  }
}
