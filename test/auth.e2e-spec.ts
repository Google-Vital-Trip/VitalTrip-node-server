import { type Server } from 'http';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/app.helper';
import { cleanDatabase } from './helpers/database.helper';

type ApiResponse<T = null> = { message: string; data: T };

const SIGNUP_BODY = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'Password1!',
  passwordConfirm: 'Password1!',
  birthDate: '1990-01-01',
  countryCode: 'KR',
  phoneNumber: '+821012345678',
};

describe('Auth (e2e)', () => {
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

  describe('GET /api/auth/check-email', () => {
    it('신규 이메일이면 available: true 반환', async () => {
      const res = await request(server)
        .get('/api/auth/check-email')
        .query({ email: 'new@example.com' });

      const body = res.body as ApiResponse<{ available: boolean }>;
      expect(res.status).toBe(200);
      expect(body.data.available).toBe(true);
    });

    it('이미 가입된 이메일이면 available: false 반환', async () => {
      await request(server).post('/api/auth/signup').send(SIGNUP_BODY);

      const res = await request(server)
        .get('/api/auth/check-email')
        .query({ email: SIGNUP_BODY.email });

      const body = res.body as ApiResponse<{ available: boolean }>;
      expect(res.status).toBe(200);
      expect(body.data.available).toBe(false);
    });
  });

  describe('POST /api/auth/signup', () => {
    it('정상 회원가입 → 201, DB에 유저 생성', async () => {
      const res = await request(server)
        .post('/api/auth/signup')
        .send(SIGNUP_BODY);

      const body = res.body as ApiResponse;
      expect(res.status).toBe(201);
      expect(body.message).toBe('성공');

      const user = await prisma.user.findUnique({
        where: { email: SIGNUP_BODY.email },
      });
      expect(user).toBeTruthy();
      expect(user!.name).toBe(SIGNUP_BODY.name);
      expect(user!.password).not.toBe(SIGNUP_BODY.password);
    });

    it('비밀번호 불일치 → 400', async () => {
      const res = await request(server)
        .post('/api/auth/signup')
        .send({ ...SIGNUP_BODY, passwordConfirm: 'DifferentPass1!' });

      expect(res.status).toBe(400);
    });

    it('중복 이메일 → 409', async () => {
      await request(server).post('/api/auth/signup').send(SIGNUP_BODY);

      const res = await request(server)
        .post('/api/auth/signup')
        .send(SIGNUP_BODY);

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(server).post('/api/auth/signup').send(SIGNUP_BODY);
    });

    it('정상 로그인 → 200, accessToken/refreshToken 반환', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: SIGNUP_BODY.email, password: SIGNUP_BODY.password });

      const body = res.body as ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }>;
      expect(res.status).toBe(200);
      expect(body.data.accessToken).toBeTruthy();
      expect(body.data.refreshToken).toBeTruthy();
    });

    it('잘못된 비밀번호 → 401', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: SIGNUP_BODY.email, password: 'WrongPassword1!' });

      expect(res.status).toBe(401);
    });

    it('존재하지 않는 이메일 → 404', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: SIGNUP_BODY.password });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('로그아웃 → 200, DB refreshToken null', async () => {
      await request(server).post('/api/auth/signup').send(SIGNUP_BODY);

      const loginRes = await request(server)
        .post('/api/auth/login')
        .send({ email: SIGNUP_BODY.email, password: SIGNUP_BODY.password });

      const { accessToken } = (
        loginRes.body as ApiResponse<{
          accessToken: string;
          refreshToken: string;
        }>
      ).data;

      const res = await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const user = await prisma.user.findUnique({
        where: { email: SIGNUP_BODY.email },
      });
      expect(user!.refreshToken).toBeNull();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('유효한 refreshToken → 200, 새 토큰 발급', async () => {
      await request(server).post('/api/auth/signup').send(SIGNUP_BODY);

      const loginRes = await request(server)
        .post('/api/auth/login')
        .send({ email: SIGNUP_BODY.email, password: SIGNUP_BODY.password });

      const { refreshToken } = (
        loginRes.body as ApiResponse<{
          accessToken: string;
          refreshToken: string;
        }>
      ).data;

      const res = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      const body = res.body as ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }>;
      expect(res.status).toBe(200);
      expect(body.data.accessToken).toBeTruthy();
      expect(body.data.refreshToken).toBeTruthy();
    });

    it('잘못된 refreshToken → 401', async () => {
      const res = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.status).toBe(401);
    });
  });
});
