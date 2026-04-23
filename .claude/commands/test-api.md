로컬 API를 curl로 빠르게 테스트합니다. 서버가 `http://localhost:3000`에서 실행 중이어야 합니다.

인자: $ARGUMENTS (테스트할 엔드포인트, 예: first-aid)

**first-aid** — 응급처치 조언 (인증 불필요)
```bash
curl -s -X POST http://localhost:3000/api/first-aid/advice \
  -H "Content-Type: application/json" \
  -d '{
    "symptomType": "BLEEDING",
    "symptomDetail": "계단에서 넘어져서 다리에서 피가 많이 나고 있어요. 어떻게 해야 할까요?",
    "latitude": 37.5665,
    "longitude": 126.978
  }' | jq .
```

**register** — 회원가입
```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"테스트"}' | jq .
```

**login** — 로그인
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq .
```

**validation-error** — 유효성 검사 실패 응답 확인
```bash
curl -s -X POST http://localhost:3000/api/first-aid/advice \
  -H "Content-Type: application/json" \
  -d '{"symptomType":"INVALID"}' | jq .
```
