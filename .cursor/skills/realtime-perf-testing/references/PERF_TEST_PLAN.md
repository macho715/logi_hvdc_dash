## 성능 테스트 계획

### 목표
- 평균 응답 시간 < 1s
- p95 < 3s
- 에러율 < 1%

### 테스트 시나리오
1. **단일 구독자**: 기본 성능 측정
2. **동시 구독자 (10명)**: 부하 테스트
3. **동시 구독자 (50명)**: 스트레스 테스트
4. **장기 실행**: 메모리 누수 확인

### 측정 지표
- HTTP 요청 지속 시간
- WebSocket 연결 지속 시간
- 메모리 사용량
- CPU 사용률

### 실행 방법
```bash
k6 run scripts/k6_api_smoke.js \
  -e SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  -e SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
```
