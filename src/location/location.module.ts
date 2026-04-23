import { Module } from '@nestjs/common';
import { FirstAidModule } from '../first-aid/first-aid.module';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { OverpassService } from './services/overpass.service';

@Module({
  imports: [FirstAidModule],
  controllers: [LocationController],
  providers: [LocationService, OverpassService],
})
export class LocationModule {}
