import { Module } from '@nestjs/common';
import { FirstAidModule } from '../first-aid/first-aid.module';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { GooglePlacesService } from './services/google-places.service';

@Module({
  imports: [FirstAidModule],
  controllers: [LocationController],
  providers: [LocationService, GooglePlacesService],
})
export class LocationModule {}
