import { Module } from '@nestjs/common';
import { EncyclopediaController } from './encyclopedia.controller';
import { EncyclopediaService } from './encyclopedia.service';

@Module({
  controllers: [EncyclopediaController],
  providers: [EncyclopediaService],
})
export class EncyclopediaModule {}
