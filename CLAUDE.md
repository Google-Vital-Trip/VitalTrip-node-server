# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 패키지 매니저

pnpm 사용. npm/yarn 명령어 사용 금지.

## 주요 명령어

```bash
pnpm start:dev        # 개발 서버 실행 (watch 모드)
pnpm build            # 프로덕션 빌드
pnpm start:prod       # 프로덕션 서버 실행
pnpm lint             # ESLint 실행
pnpm test             # 유닛 테스트
pnpm test:e2e         # E2E 테스트
```

## 아키텍처

NestJS + TypeORM + MySQL 백엔드. 전역 API prefix `/api`.

```
src/
├── common/               # 전역 필터, 인터셉터, 에러코드
│   ├── filters/          # HttpExceptionFilter — 모든 예외를 통일 응답으로 변환
│   ├── interceptors/     # ResponseInterceptor — 성공 응답 래핑
│   └── constants/        # ErrorCode enum
├── first-aid/            # 응급처치 AI 조언 API (공개, 인증 불필요)
│   ├── services/         # GeocodingService, EmergencyContactService, OpenAIService
│   └── constants/        # 국가별 응급번호 정적 맵
├── auth/                 # 회원가입 / JWT 로그인
└── users/                # User 엔티티 및 서비스
```

## 응답 포맷

모든 API 응답은 아래 형식을 따름.

**성공**
```json
{ "message": "성공", "data": { ... } }
```

**실패**
```json
{ "message": "오류 설명", "data": null, "errorCode": "ERROR_CODE" }
```

에러코드는 `src/common/constants/error-codes.ts`의 `ErrorCode` enum 참고.

## 환경 변수

`.env` 파일 필요 (`.env.example` 참고). 주요 키: `DB_*`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `OPENAI_API_KEY`.

## 브랜치 전략

기능별로 브랜치를 분리하고 PR을 생성함.
- `feature/project-setup` — 초기 설정 및 공통 모듈
- `feature/first-aid` — 응급처치 API
- `feature/auth` — 회원가입 / 로그인

## 커밋 규칙

- **한국어** 한 줄, 역할별로 커밋 분리
- `Co-Authored-By` 줄 추가 금지
- 예: `feat: 역지오코딩 서비스 구현 (Nominatim)`

## first-aid 모듈 동작 흐름

`POST /api/first-aid/advice` 요청 시:
1. `GeocodingService` — Nominatim API로 위도/경도 → 국가코드 변환
2. `EmergencyContactService` — 국가코드로 응급번호 조회 (정적 맵, 미등록 시 `112` DEFAULT)
3. `OpenAIService` — GPT-4o 호출 (`response_format: json_object`), content/summary/recommendedAction/confidence/blogLinks 반환
4. `FirstAidService` — 위 세 결과 조합 후 응답
