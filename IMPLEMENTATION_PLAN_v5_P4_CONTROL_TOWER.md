# HVDC Dashboard v5 — P4 Control Tower Implementation Plan

Last updated: 2026-03-15
Status: Active SSOT

> Supersedes `IMPLEMENTATION_PLAN_v4.md` for dashboard redesign.
> `IMPLEMENTATION_PLAN_v4.md` is retained for prior implementation history and migration context.

## Goal and Benchmark

이 문서는 HVDC 통합 대시보드의 최신 설계 SSOT이다.

목표 수준:

- `Palantir` 수준의 decision density
- `Maersk Control Tower` 수준의 network visibility
- `Amazon Logistics` 수준의 operator execution speed

핵심 방향:

- 하나의 dark glass control tower visual system
- map/network 중심 first-fold
- 적은 수의 고가치 KPI
- alert, queue, recovery를 decision-first로 배치
- deep-link 기반 cross-page drilldown 유지

적용 범위:

- `Overview`
- `Chain`
- `Pipeline`
- `Sites`
- `Cargo`

## Visual SSOT

이 문서의 visual/source 기준은 아래 3개다.

1. `P3_DASHVOARD_NEW.png`
   - 저장 위치: 저장소 루트
   - 역할: visual reference
   - 기준: dark tone, map prominence, KPI density, mission deck rhythm, bottom launcher hierarchy

2. `C:\Users\jichu\Downloads\P4.MD`
   - 역할: whole-dashboard IA and style direction
   - 기준: app shell, page roles, token direction, whole-dashboard expansion principles

3. `C:\Users\jichu\Downloads\P4.js`
   - 역할: overview implementation scaffold
   - 기준: overview composition, section shells, flow summary strip, launcher bar, collapsible ops layer

해석 원칙:

- `P3_DASHVOARD_NEW.png`는 pixel copy 기준이 아니라 style + hierarchy 기준이다.
- `P4.MD`는 전체 대시보드 확장 규칙의 상위 문서다.
- `P4.js`는 overview 레이아웃 스캐폴드로 채택하되, 저장소의 실제 theme/runtime 구조에 맞게 이식한다.

## Overview v4 Baseline

Overview는 아래 순서를 baseline으로 고정한다.

1. `command rail`
2. `KPI strip`
3. `map + mission control`
4. `site matrix`
5. `flow summary`
6. `launcher`
7. `collapsed ops layer`

세부 원칙:

- `command rail`
  - search
  - quick chips / map toggles
  - updated time
  - language toggle
  - new voyage action
- `KPI strip`
  - `Total Shipments`
  - `Delivered to Site`
  - `Open Radar`
  - `Overdue ETA`
  - `MOSB Pending`
  - `AGI Readiness`
  - freshness는 우측 compact badge 또는 inline state로 처리
- `map + mission control`
  - map이 first-fold 주연
  - mission control은 `Critical Alerts`, `Action Queue`, `Next 72h`, `optional Live Feed`
- `site matrix`
  - `SHU / MIR / DAS / AGI` 4-card board
  - AGI만 추가 risk emphasis 허용
- `flow summary`
  - decorative ribbon이 아니라 clickable summary
  - 사용자는 plain-language route family만 본다
- `launcher`
  - `Logistics Chain`
  - `Pipeline`
  - `Sites`
  - `Cargo`
- `collapsed ops layer`
  - `Open Radar`
  - `WH Pressure`
  - `Worklist`
  - `Exceptions`
  - `Recent Activity`
  - 기본 상태는 closed

## Whole Dashboard Expansion

모든 페이지는 같은 glass-dark control-tower family로 확장한다.

### Overview

- 전체 체인 판단
- mission posture
- site readiness
- launcher 역할

### Chain

- 공급망 구조 설명과 investigation canvas
- origin / port / warehouse / mosb / site focus 유지
- node-chain과 disruption context를 같은 visual system으로 재배치

### Pipeline

- 단계별 병목 분석
- luminous stage strip
- bottleneck evidence row
- backlog table는 dense operator surface로 유지

### Sites

- 현장별 납품률과 blocker 관리
- 4-site board + selected-site workbench 구조
- AGI는 expanded risk section 허용

### Cargo

- 상세 데이터 조회와 operator execution
- sticky filters
- dense data grid
- selected row 강조
- glass drawer surface

공통 규칙:

- 같은 panel language
- 같은 chip/badge/risk system
- 같은 spacing rhythm
- 같은 drilldown launcher logic

## Design System and Tokens

Theme SSOT는 `tailwind.config.ts`가 아니라 현재 저장소 구조를 유지한다.

공식 SSOT:

- `apps/logistics-dashboard/app/globals.css`
- `apps/logistics-dashboard/lib/overview/ui.ts`

P4 기준 토큰 방향:

- background
  - app bg: `#070B16`
  - panel bg: `#0B1324`
  - panel inner: `#0E1830`
  - hover: `#12203C`
- text
  - primary: `#F4F7FF`
  - secondary: `rgba(244,247,255,0.68)`
  - tertiary: `rgba(244,247,255,0.40)`
- border
  - soft: `rgba(255,255,255,0.08)`
  - strong: `rgba(82,125,255,0.22)`
- accents
  - brand blue: `#2F6BFF`
  - cyan: `#35D6FF`
  - green: `#2ED47A`
  - amber: `#F6B445`
  - red: `#FF5F6D`
  - violet: `#8B6CFF`
- glow
  - blue glow
  - cyan glow
  - red glow

Card rules:

- radius: `24px`
- padding: `16~20px`
- glass gradient panel
- soft border
- premium shadow

KPI rules:

- 숫자는 크게
- 설명은 얇고 작게
- 위험 표현은 전체 빨간 배경이 아니라 local accent 위주

## Data and Contract Rules

이 문서는 UI redesign SSOT이며, 데이터 계약은 아래 규칙을 유지한다.

- `Supabase` is the SSOT
- `route_type` 중심 UX 유지
- `Flow Code`는 내부 adapter로만 유지
- user-facing UI에서는 `FC0~FC5` 직접 노출 금지
- URL restore 유지
- `NavigationIntent` 유지
- `buildDashboardLink()` 유지
- `page.tsx + Suspense + *PageClient.tsx` 유지

유지되는 대표 query contract:

- `route_type`
- `stage`
- `site`
- `focus`
- `tab`
- `caseId`
- `vendor`
- `category`
- `voyage_stage`

데이터 측 비목표:

- DB schema redesign 없음
- RLS 변경 없음
- realtime ownership 변경 없음
- service-role exposure 없음

## Implementation Phases

### Phase 1. Root SSOT Freeze

- 본 문서를 root active SSOT로 고정
- `v4`와의 역할 구분 명시
- 관련 P3/P4 메모는 reference로 유지

### Phase 2. Overview Flagship

- `P4.js` 구조를 저장소 현실에 맞게 이식
- `OverviewPageClient` 재조합
- `command rail`, `map shell`, `mission deck`, `site matrix`, `flow summary`, `launcher`, `ops layer` 구현
- `P3_DASHVOARD_NEW.png`와 시각 비교로 hierarchy 조정

### Phase 3. Whole Dashboard Restyle

- `Chain`, `Pipeline`, `Sites`, `Cargo`에 같은 visual system 확장
- context banner, page shell, chips, badges, tables, drawer, charts 정렬

### Phase 4. Docs and Verification

- `docs/superpowers/plans/2026-03-15-hvdc-dashboard-v4-p4.md` 요약본 작성
- `apps/logistics-dashboard/docs/*` 동기화
- README, screenshots, CHANGELOG 정리
- local/prod parity 점검

## Acceptance Criteria

문서 기준 완료 조건:

- root에 active SSOT가 하나만 존재하고, 본 문서가 그 역할을 수행한다
- `IMPLEMENTATION_PLAN_v4.md`와의 역할 차이가 명확히 적혀 있다
- visual 기준 문서 3개가 모두 명시되어 있다
- overview baseline 구조가 decision-complete 상태로 기록되어 있다
- whole-dashboard expansion 원칙이 페이지별로 분명하게 정리되어 있다
- design system, data contract, implementation phase가 후속 구현자가 바로 사용할 수 있을 정도로 구체적이다

구현 단계 완료 기준:

- overview가 `P3_DASHVOARD_NEW.png`와 같은 hierarchy로 동작
- 다른 페이지도 동일 control-tower family로 정렬
- deep-link, URL restore, route_type UX, Korean-first label이 유지

## Non-goals

- 이번 문서 단계에서 실제 코드 구현을 완료하는 것
- DB schema, RLS, Supabase topology를 바꾸는 것
- `Flow Code`를 사용자 UI에 다시 노출하는 것
- `tailwind.config.ts`를 theme SSOT로 되돌리는 것
- 기존 deep-link/navigation contract를 깨는 것
