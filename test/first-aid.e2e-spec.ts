import { type Server } from 'http';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/app.helper';
import { cleanDatabase } from './helpers/database.helper';

type ApiResponse<T = null> = { message: string; data: T };

interface AdviceData {
  content: string;
  summary: string;
  recommendedAction: string;
  confidence: number;
  identificationResponse: {
    countryCode: string;
    emergencyContact: unknown;
  };
}

const VALID_BODY = {
  symptomType: 'BLEEDING',
  symptomDetail: '손가락에서 피가 많이 나고 멈추지 않습니다.',
  latitude: 37.5665,
  longitude: 126.978,
};

describe('First Aid (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    server = app.getHttpServer() as Server;
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('POST /api/first-aid/advice', () => {
    it('정상 요청 → 201, AI 조언 및 응급연락처 반환', async () => {
      const res = await request(server)
        .post('/api/first-aid/advice')
        .send(VALID_BODY);

      const body = res.body as ApiResponse<AdviceData>;
      expect(res.status).toBe(201);
      expect(body.message).toBe('성공');
      expect(body.data.content).toBeTruthy();
      expect(body.data.summary).toBeTruthy();
      expect(body.data.recommendedAction).toBeTruthy();
      expect(body.data.confidence).toBeDefined();
      expect(body.data.identificationResponse.countryCode).toBe('KR');
      expect(body.data.identificationResponse.emergencyContact).toBeDefined();
    });

    it('인증 없이도 호출 가능 (공개 엔드포인트)', async () => {
      const res = await request(server)
        .post('/api/first-aid/advice')
        .send(VALID_BODY);

      expect(res.status).toBe(201);
    });

    it('응급처치 요청이 DB에 로그 저장', async () => {
      await request(server).post('/api/first-aid/advice').send(VALID_BODY);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const logs = await prisma.firstAidLog.findMany();
      expect(logs.length).toBe(1);
      expect(logs[0].symptomType).toBe('BLEEDING');
      expect(logs[0].countryCode).toBe('KR');
      expect(logs[0].userId).toBeNull();
    });

    it('symptomDetail이 10자 미만 → 400', async () => {
      const res = await request(server)
        .post('/api/first-aid/advice')
        .send({ ...VALID_BODY, symptomDetail: '짧음' });

      expect(res.status).toBe(400);
    });

    it('latitude 범위 초과 → 400', async () => {
      const res = await request(server)
        .post('/api/first-aid/advice')
        .send({ ...VALID_BODY, latitude: 999 });

      expect(res.status).toBe(400);
    });

    it('잘못된 symptomType → 400', async () => {
      const res = await request(server)
        .post('/api/first-aid/advice')
        .send({ ...VALID_BODY, symptomType: 'UNKNOWN_TYPE' });

      expect(res.status).toBe(400);
    });
  });
});
