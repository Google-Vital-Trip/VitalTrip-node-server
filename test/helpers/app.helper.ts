import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as typeof import('cookie-parser');
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { OpenAiService } from '../../src/first-aid/services/openai.service';
import { VectorStoreService } from '../../src/first-aid/services/vector-store.service';
import { RagService } from '../../src/first-aid/services/rag.service';
import { GeocodingService } from '../../src/first-aid/services/geocoding.service';

const mockOpenAiService = {
  getAdvice: jest.fn().mockResolvedValue({
    content: '출혈 부위를 깨끗한 천으로 압박하세요\n압박을 5분 이상 유지하세요',
    summary: '직접 압박으로 출혈을 멈추세요.',
    recommendedAction: '119에 즉시 신고하세요.',
    disclaimer: '본 정보는 참고용이며 전문 의료 조언을 대체하지 않습니다.',
    confidence: 85,
    blogLinks: ['https://example.com/first-aid'],
  }),
};

const mockGeocodingService = {
  getCountryInfo: jest.fn().mockResolvedValue({
    countryCode: 'KR',
    countryName: 'South Korea',
  }),
};

const mockVectorStoreService = {
  onModuleInit: jest.fn().mockResolvedValue(undefined),
  search: jest.fn().mockResolvedValue([]),
  client: {},
};

const mockRagService = {
  findRelevantDocuments: jest.fn().mockResolvedValue([]),
};

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(OpenAiService)
    .useValue(mockOpenAiService)
    .overrideProvider(GeocodingService)
    .useValue(mockGeocodingService)
    .overrideProvider(VectorStoreService)
    .useValue(mockVectorStoreService)
    .overrideProvider(RagService)
    .useValue(mockRagService)
    .compile();

  const app = moduleFixture.createNestApplication(new ExpressAdapter());

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  await app.init();
  return app;
}
