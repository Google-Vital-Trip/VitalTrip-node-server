import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const errorRate = new Rate('errors');
const firstAidDuration = new Trend('first_aid_duration');
const locationDuration = new Trend('location_duration');

export const options = {
  scenarios: {
    // 1단계: 워밍업 (10명, 30초)
    warmup: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      tags: { scenario: 'warmup' },
    },
    // 2단계: 부하 증가 (10 → 100명, 1분)
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      startTime: '30s',
      tags: { scenario: 'ramp_up' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.05'],
    first_aid_duration: ['p(95)<3000'],
    location_duration: ['p(95)<1000'],
  },
};

// 테스트용 계정 (미리 가입된 계정 필요)
const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'loadtest@test.com',
  password: __ENV.TEST_PASSWORD || 'Test1234!',
};

export default function () {
  testAuth();
  sleep(1);
}

function testAuth() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(TEST_USER),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const ok = check(res, {
    'login 200': (r) => r.status === 200,
    'login has token': (r) => {
      const body = JSON.parse(r.body);
      return body.data?.accessToken !== undefined;
    },
  });

  errorRate.add(!ok);
}

function testFirstAid() {
  const start = Date.now();

  const res = http.post(
    `${BASE_URL}/api/first-aid/advice`,
    JSON.stringify({
      symptomType: 'BLEEDING',
      symptomDetail: '손을 칼에 베였습니다',
      latitude: 37.5665,
      longitude: 126.978,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  firstAidDuration.add(Date.now() - start);

  const ok = check(res, {
    'first-aid 2xx': (r) => r.status >= 200 && r.status < 300,
    'first-aid has content': (r) => {
      const body = JSON.parse(r.body);
      return body.data?.content !== undefined;
    },
  });

  errorRate.add(!ok);
}

function testLocation() {
  const start = Date.now();

  const res = http.get(
    `${BASE_URL}/api/location/nearby?latitude=37.5665&longitude=126.978&radius=1000&type=hospital&language=ko`,
  );

  locationDuration.add(Date.now() - start);

  const ok = check(res, {
    'location 200': (r) => r.status === 200,
  });

  errorRate.add(!ok);
}
