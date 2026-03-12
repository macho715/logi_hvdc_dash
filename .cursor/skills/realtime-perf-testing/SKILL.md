---
name: realtime-perf-testing
description: Supabase Realtime 성능 및 부하 테스트를 수행하는 스킬.
---

## 목적
실시간 업데이트 성능 검증.

## 사용 시점
- Realtime 구독 성능 측정
- 부하 테스트
- Gate 3 성능 검증

## 입력
- Supabase URL/Key (환경변수)
- scripts/k6_api_smoke.js
- references/PERF_TEST_PLAN.md

## 출력
- 성능 리포트
- 응답 시간 통계
- 부하 한계 분석

## 목표
- 평균 응답 시간 < 1s
- p95 < 3s
- 동시 구독자 처리 능력 검증

## 절차
1. 테스트 시나리오 작성
2. k6 스크립트 실행
3. 결과 분석 및 리포트 생성

## 필수 참조
- [AGENTS.md](../../../AGENTS.md) - 프로젝트 규칙 (최우선)
- [SSOT.md](../hvdc-logistics-ssot/references/SSOT.md) - 단일 진실원 (hvdc-logistics-ssot 스킬 참조)

## 참조
- scripts/k6_api_smoke.js
- references/PERF_TEST_PLAN.md
