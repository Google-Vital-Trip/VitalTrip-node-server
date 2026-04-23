import { Module } from '@nestjs/common';
import { FirstAidController } from './first-aid.controller';
import { FirstAidService } from './first-aid.service';
import { GeocodingService } from './services/geocoding.service';
import { EmergencyContactService } from './services/emergency-contact.service';
import { OpenAiService } from './services/openai.service';

@Module({
  controllers: [FirstAidController],
  providers: [FirstAidService, GeocodingService, EmergencyContactService, OpenAiService],
})
export class FirstAidModule {}
