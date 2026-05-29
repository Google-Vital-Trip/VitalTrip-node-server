import { type Server } from 'http';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/app.helper';
import { cleanDatabase } from './helpers/database.helper';

type ApiResponse<T = null> = { message: string; data: T };

interface TopicItem {
  title: string;
  altTitles: string[];
  categories: string[];
}

interface TopicsData {
  total: number;
  items: TopicItem[];
}

describe('Encyclopedia (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    server = app.getHttpServer() as Server;
    await cleanDatabase(prisma);

    await prisma.healthTopic.createMany({
      data: [
        {
          title: 'Burns',
          altTitles: '["Chemical Burns","Thermal Burns"]',
          summary: 'Burns are injuries caused by heat.',
          fullSummary:
            'Burns are injuries to skin caused by heat, chemicals, or radiation.',
          categories: '["Injuries and Wounds"]',
          meshTerms: '["Burns"]',
          url: 'https://medlineplus.gov/burns.html',
        },
        {
          title: 'Bleeding',
          altTitles: '["Hemorrhage","Blood Loss"]',
          summary: 'Bleeding is the loss of blood.',
          fullSummary:
            'Bleeding is the loss of blood from the circulatory system.',
          categories: '["Injuries and Wounds"]',
          meshTerms: '["Hemorrhage"]',
          url: 'https://medlineplus.gov/bleeding.html',
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('GET /api/encyclopedia', () => {
    it('전체 조회 → total/items 반환', async () => {
      const res = await request(server).get('/api/encyclopedia');

      const body = res.body as ApiResponse<TopicsData>;
      expect(res.status).toBe(200);
      expect(body.data.total).toBe(2);
      expect(body.data.items.length).toBe(2);
    });

    it('키워드 검색 → 일치하는 항목만 반환', async () => {
      const res = await request(server)
        .get('/api/encyclopedia')
        .query({ search: 'Burns' });

      const body = res.body as ApiResponse<TopicsData>;
      expect(res.status).toBe(200);
      expect(body.data.items.length).toBe(1);
      expect(body.data.items[0].title).toBe('Burns');
    });

    it('altTitles가 배열로 파싱되어 반환', async () => {
      const res = await request(server)
        .get('/api/encyclopedia')
        .query({ search: 'Burns' });

      const body = res.body as ApiResponse<TopicsData>;
      expect(Array.isArray(body.data.items[0].altTitles)).toBe(true);
      expect(body.data.items[0].altTitles).toContain('Chemical Burns');
    });

    it('categories가 배열로 파싱되어 반환', async () => {
      const res = await request(server).get('/api/encyclopedia');

      const body = res.body as ApiResponse<TopicsData>;
      expect(Array.isArray(body.data.items[0].categories)).toBe(true);
    });

    it('pagination offset/limit 적용', async () => {
      const res = await request(server)
        .get('/api/encyclopedia')
        .query({ offset: 0, limit: 1 });

      const body = res.body as ApiResponse<TopicsData>;
      expect(res.status).toBe(200);
      expect(body.data.items.length).toBe(1);
      expect(body.data.total).toBe(2);
    });

    it('인증 없이 호출 가능 (공개 엔드포인트)', async () => {
      const res = await request(server).get('/api/encyclopedia');
      expect(res.status).toBe(200);
    });
  });
});
