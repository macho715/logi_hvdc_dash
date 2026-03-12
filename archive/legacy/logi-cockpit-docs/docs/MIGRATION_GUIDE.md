# MIGRATION GUIDE (Template, migrated)

이관/마이그레이션 가이드는 현재 프로젝트 문서로 **병합**되었습니다.

- ✅ **현행 SSOT**:
  - `docs/MIGRATION_CHECKLIST.md` — Monorepo/구조 이관 체크리스트
  - `docs/migrations/FLOW_CODE_V35_MIGRATION_GUIDE.md` — Flow Code v3.5 마이그레이션 가이드

> 이 파일은 **초기 마이그레이션 템플릿**으로만 참고하세요.
> 실제 이관/마이그레이션 절차 변경은 루트 `docs/*` 문서를 기준으로 관리합니다.
# Monorepo 마이그레이션 가이드

> 목표: 3개의 독립 프로젝트(HVDC, Logistics, Ontology Scripts)를 하나의 Monorepo로 통합하되, **회귀 위험을 최소화**합니다.

## 0) 원칙

- **작게 쪼개기**: 구조 이동(PR 1) → 실행 확인(PR 2) → 공유 패키지(PR 3)
- **동작 보존(behavior-preserving)**: 이동/rename 단계에서는 로직 변경 금지
- **SSOT 문서화**: 이동한 즉시 `STATUS.md`에 반영

---

## 1) 작업 전략 선택

### 전략 A (권장) — 새 통합 repo 생성 후 코드 복사

- 장점: 히스토리/리모트 얽힘이 적음, 실패 시 롤백 쉬움
- 단점: 각 레포 커밋 히스토리를 유지하기 어렵다

### 전략 B — git subtree/submodule로 히스토리 일부 유지

- 장점: 히스토리 유지 가능
- 단점: 운영 복잡도 증가

> 본 가이드는 **전략 A**를 기준으로 작성합니다.

---

## 2) 초기 스캐폴딩(루트)

### 2.1 디렉토리 생성

```bash
mkdir -p apps packages scripts configs supabase/migrations docs
```

### 2.2 Workspaces 설정(예: pnpm)

> 팀 표준에 맞춰 `pnpm` 또는 `npm` Workspaces를 선택하세요.

- `pnpm-workspace.yaml` (예시)

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- 루트 `package.json` (예시)

```json
{
  "name": "logi-cockpit",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test"
  }
}
```

### 2.3 TurboRepo (선택)

- `turbo.json`에 각 앱/패키지의 build cache를 정의

---

## 3) 앱 이관

### 3.1 Logistics 앱 이동

1) 원본 레포에서 폴더 복사

```bash
cp -R /path/to/v0-logistics-dashboard-build-main apps/logistics-dashboard
```

2) 앱 내부 의존성 점검

- `package.json`의 `name`을 `logistics-dashboard`로 정리
- import alias(`@/`)가 App Router 기준으로 동작하는지 확인

3) 로컬 실행

```bash
pnpm --filter logistics-dashboard dev
```

### 3.2 HVDC 앱 이동

```bash
cp -R /path/to/HVDC_DASH/hvdc-dashboard apps/hvdc-dashboard
pnpm --filter hvdc-dashboard dev
```

> **체크:** 포트 충돌이 나면 `dev` 스크립트 또는 `next dev -p 3001`처럼 포트를 분리합니다.

---

## 4) scripts/configs 이관

### 4.1 scripts

```bash
cp -R /path/to/logiontology_scaffold_2026-01-23/scripts ./scripts
```

### 4.2 configs

```bash
cp -R /path/to/logiontology_scaffold_2026-01-23/configs ./configs
```

> **중요:** `configs/columns.hvdc_status.json`이 컬럼 SSOT가 되도록, 하드코딩 제거 및 `--config` 플래그를 스크립트에 반영합니다.

---

## 5) 공유 패키지 추출(권장 순서)

### 5.1 packages/ui-components

- 양 앱에서 중복으로 쓰는 UI primitives(카드, 테이블, 드로어, 버튼)를 이관
- 단순 re-export가 아니라 “팀 표준 래퍼”로 두는 것을 권장

### 5.2 packages/hvdc-workbench

- HVDC의 `KpiStrip`, `WorklistTable`, `DetailDrawer`, `SavedViewsBar` 등을 패키지화
- hvdc-dashboard가 먼저 패키지를 사용하도록 리팩토링 → 회귀 테스트
- 그 다음 logistics-dashboard에서 패널로 임베드

---

## 6) 환경변수/설정 통일

### 6.1 공통 .env

- root `.env.example` 작성(필수 키 목록)
- 앱별 `.env.local`에는 민감 값 저장

### 6.2 Supabase SSOT

- 기존 HVDC 프로젝트의 Supabase를 “기준”으로 삼고,
- Logistics(지도용) 데이터를 동일 DB에 적재

---

## 7) 통합 레이아웃 적용(Phase 2)

1) `apps/logistics-dashboard`에 `OpsCockpitPage` 생성
2) `MapView`(좌) + `RightPanel`(우) + `HvdcWorkbench`(하) 조립
3) 공용 store로 선택/필터 동기화

---

## 8) 검증 체크리스트(필수)

- [ ] 두 앱이 monorepo에서 각각 dev/build 성공
- [ ] HVDC `/api/worklist` 결과가 이관 전과 동일
- [ ] MapView가 동작(zoom/pan/hover)하고, 레이어 토글이 정상
- [ ] `scripts/json_to_ttl.py`가 config 기반으로 동작하고 used_cols 로그를 남김

---

## 9) Simulation Log (재현 가능한 검증)

- `pnpm -w install`
- `pnpm --filter hvdc-dashboard dev` / `pnpm --filter logistics-dashboard dev`
- 샘플 데이터 50건으로 `scripts/run_status_pipeline.py` 실행

Feasibility: **PASS** (단, 히스토리 유지가 필요하면 전략 B 고려)
