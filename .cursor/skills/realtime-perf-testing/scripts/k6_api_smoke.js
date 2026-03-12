// k6 Realtime 성능 테스트 스크립트
// Supabase Realtime 구독 성능 측정

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // 램프업
    { duration: '1m', target: 50 },    // 정상 부하
    { duration: '30s', target: 0 },     // 램프다운
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // p95 < 3s
    http_req_duration: ['avg<1000'],    // 평균 < 1s
    errors: ['rate<0.01'],               // 에러율 < 1%
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

export default function () {
  // Realtime 구독 테스트 (WebSocket 기반)
  // 실제 구현은 Supabase Realtime API에 맞게 조정 필요
  
  // 예시: REST API 엔드포인트 테스트
  const url = `${SUPABASE_URL}/rest/v1/location_statuses?select=*&limit=10`;
  const params = {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  };
  
  const res = http.get(url, params);
  
  const checkResult = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!checkResult);
  
  sleep(1);
}
