import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { IdentifyCountryDto } from './dto/identify-country.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('identify-country')
  async identifyCountry(@Body() dto: IdentifyCountryDto) {
    return this.locationService.identifyCountry(dto.latitude, dto.longitude);
  }

  @Get('nearby')
  async getNearby(@Query() query: NearbyQueryDto) {
    return this.locationService.getNearbyFacilities(
      query.latitude,
      query.longitude,
      query.radius,
      query.type,
      query.language,
    );
  }
}
