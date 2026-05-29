import { Module } from '@nestjs/common';
import { FirstAidController } from './first-aid.controller';
import { FirstAidService } from './first-aid.service';
import { GeocodingService } from './services/geocoding.service';
import { EmergencyContactService } from './services/emergency-contact.service';
import { OpenAiService } from './services/openai.service';
import { VectorStoreService } from './services/vector-store.service';
import { RagService } from './services/rag.service';
import { FirstAidLogListener } from './listeners/first-aid-log.listener';

@Module({
  controllers: [FirstAidController],
  providers: [
    FirstAidService,
    GeocodingService,
    EmergencyContactService,
    VectorStoreService,
    RagService,
    OpenAiService,
    FirstAidLogListener,
  ],
  exports: [GeocodingService, EmergencyContactService],
})
export class FirstAidModule {}
