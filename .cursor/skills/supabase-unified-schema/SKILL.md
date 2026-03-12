---
name: supabase-unified-schema
description: Supabase 통합 스키마, RLS, Realtime 설계를 수행하는 스킬.
---

## 목적
HVDC·물류 데이터를 단일 스키마로 통합한다.

## 사용 시점
- 초기 스키마 설계
- 마이그레이션 계획
- RLS 정책 추가/수정

## 입력
- 기존 테이블 인벤토리
- references/DATA_MODEL.md
- AGENTS.md (데이터 모델 섹션)

## 출력
- SQL 스키마 (assets/schema_v1.sql)
- 테이블 관계 정의
- RLS 정책 SQL
- Realtime 구독 설정

## 절차
1. 기존 테이블 인벤토리
2. 통합 스키마 설계
3. RLS 정책 정의
4. Realtime 대상 테이블 지정

## 안전
- DROP/DELETE 금지
- 마이그레이션 전 검토 필수
- 서비스 role 키는 Edge Function에서만 사용

## 필수 참조
- [AGENTS.md](../../../AGENTS.md) - 프로젝트 규칙 (최우선)
- [SSOT.md](../hvdc-logistics-ssot/references/SSOT.md) - 단일 진실원 (hvdc-logistics-ssot 스킬 참조)

## 참조
- assets/schema_v1.sql
- references/DATA_MODEL.md
