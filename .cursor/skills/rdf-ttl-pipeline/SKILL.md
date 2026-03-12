---
name: rdf-ttl-pipeline
description: HVDC JSON 데이터를 RDF(Turtle)로 변환하고 정합성을 검증하는 스킬.
---

## 목적
관계형 데이터와 온톨로지 간 일관성 유지.

## 사용 시점
- JSON → TTL 변환
- 컬럼 사용 검증
- 온톨로지 정합성 확인

## 입력
- HVDC JSON 데이터
- 컬럼 스펙 (JSON)
- assets/columns.hvdc_status.example.json

## 출력
- TTL 파일
- 사용 컬럼 로그
- 검증 리포트

## 절차
1. 컬럼 스펙(SSOT) 로드
2. JSON → TTL 변환 실행
3. 사용 컬럼 감사 로그 생성
4. 정합성 검증

## 필수 참조
- [AGENTS.md](../../../AGENTS.md) - 프로젝트 규칙 (최우선)
- [SSOT.md](../hvdc-logistics-ssot/references/SSOT.md) - 단일 진실원 (hvdc-logistics-ssot 스킬 참조)

## 참조
- assets/columns.hvdc_status.example.json
- scripts/validate_used_cols.py
- references/RDF_MAPPING_GUIDE.md
