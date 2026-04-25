import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { IdentifyCountryDto } from './dto/identify-country.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @ApiOperation({ summary: '좌표로 국가 식별' })
  @ApiOkResponse({
    description: '국가 코드 및 이름',
    schema: {
      example: {
        message: '성공',
        data: { countryCode: 'KR', countryName: 'South Korea' },
      },
    },
  })
  @Post('identify-country')
  async identifyCountry(@Body() dto: IdentifyCountryDto) {
    return this.locationService.identifyCountry(dto.latitude, dto.longitude);
  }

  @ApiOperation({ summary: '주변 의료시설 검색 (Google Places)' })
  @ApiOkResponse({
    description: '주변 시설 목록',
    schema: {
      example: {
        message: '성공',
        data: [
          {
            placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            name: '서울대학교병원',
            address: '서울특별시 종로구 대학로 101',
            location: { lat: 37.58, lng: 126.99 },
            openNow: true,
            rating: 4.2,
            types: ['hospital'],
          },
        ],
      },
    },
  })
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
