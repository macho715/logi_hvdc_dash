아래는 제공해주신 통합 문서를 **Agent Skills 오픈 표준(SKILL.md)**에 맞춰 **Cursor에서 사용 가능한 Codex Skill “풀 패키지”**로 정리·작성한 결과입니다.
(Repo‑scoped 기준으로 작성하되, Codex / Cursor / Claude Code / VS Code Copilot에서 재사용 가능하도록 설치 경로를 함께 안내합니다.)

---

## 1) 가정 / 전제 (짧게)

* 통합 대상은 **Next.js 15 기반 HVDC 대시보드**와 **v0 기반 물류 대시보드**이며, **monorepo(turborepo)** 구조를 사용합니다.
* **Supabase**가 단일 저장소(인증·DB·Realtime)로 사용 가능하며, 키는 환경변수로만 관리합니다.
* **HVDC JSON → RDF(Turtle)** 파이프라인(`json_to_ttl.py`)은 이미 존재하며 컬럼 스펙(JSON)을 SSOT로 사용합니다.
* 팀은 **Cursor**를 주 IDE로 사용하고, **OpenAI Codex Skill 포맷**을 함께 사용합니다.

---

## 2) Discovery 질문

* (이미 충분한 정보가 제공되어 **추가 질문 없음**)

---

## 3) Skill Map (설계)

| skill name                | 1줄 목적                      | 트리거 키워드                          | 리소스                           | 위험/권한     |
| ------------------------- | -------------------------- | -------------------------------- | ----------------------------- | --------- |
| `hvdc-logistics-ssot`     | 통합 프로젝트 SSOT(로드맵·UX·검증) 참조 | SSOT, 로드맵, 통합, HVDC, 물류          | references/SSOT.md            | 없음(읽기 전용) |
| `hvdc-logistics-planning` | 통합 로드맵·시스템 문서 생성/갱신        | roadmap, architecture, IA, gate  | references/DOC_OUTLINES.md    | 없음        |
| `supabase-unified-schema` | Supabase 통합 스키마·RLS 설계     | supabase, schema, RLS, realtime  | assets/schema_v1.sql          | DB 변경 권한  |
| `unified-dashboard-ui`    | 지도+패널+워크리스트 UI 구현          | map, KPI, worklist, WCAG         | references/COMPONENT_SPEC.md  | 없음        |
| `rdf-ttl-pipeline`        | JSON→TTL 파이프라인·정합성 검증      | RDF, ontology, TTL, mapping      | scripts/validate_used_cols.py | 파일 접근     |
| `realtime-perf-testing`   | Realtime·성능·부하 검증          | realtime, performance, load test | scripts/k6_api_smoke.js       | 테스트 트래픽   |
| `handoff-docs-bundle`     | README·환경·핸드오프 산출          | README, env, handoff             | assets/env.example            | 없음        |

---

## 4) 생성 파일 트리

```text
agent-skills/
├─ hvdc-logistics-ssot/
│  ├─ SKILL.md
│  └─ references/
│     ├─ SSOT.md
│     └─ QUICK_SUMMARY.md
├─ hvdc-logistics-planning/
│  ├─ SKILL.md
│  └─ references/
│     └─ DOC_OUTLINES.md
├─ supabase-unified-schema/
│  ├─ SKILL.md
│  ├─ assets/
│  │  └─ schema_v1.sql
│  └─ references/
│     └─ DATA_MODEL.md
├─ unified-dashboard-ui/
│  ├─ SKILL.md
│  └─ references/
│     ├─ COMPONENT_SPEC.md
│     └─ A11Y_CHECKLIST.md
├─ rdf-ttl-pipeline/
│  ├─ SKILL.md
│  ├─ assets/
│  │  └─ columns.hvdc_status.example.json
│  ├─ scripts/
│  │  └─ validate_used_cols.py
│  └─ references/
│     └─ RDF_MAPPING_GUIDE.md
├─ realtime-perf-testing/
│  ├─ SKILL.md
│  ├─ scripts/
│  │  └─ k6_api_smoke.js
│  └─ references/
│     └─ PERF_TEST_PLAN.md
├─ handoff-docs-bundle/
│  ├─ SKILL.md
│  ├─ assets/
│  │  └─ env.example
│  └─ references/
│     ├─ README_TEMPLATE.md
│     └─ CHANGELOG_TEMPLATE.md
└─ AGENTS.md
```

---

## 5) 파일별 내용 (복사·붙여넣기 가능)

### `AGENTS.md`

```markdown
# HVDC + Logistics 통합 프로젝트 규칙 (AGENTS)

## 공통
- Next.js(App Router) + TypeScript 사용
- monorepo 구조: /apps, /packages
- Supabase를 단일 데이터 저장소로 사용
- 비밀값/토큰은 환경변수로만 관리

## 데이터
- Supabase 테이블은 정규화 유지
- RDF 변환 컬럼 스펙(JSON)을 SSOT로 관리
- 서비스 role 키는 Edge Function에서만 사용

## UI/UX
- 다크 모드 기본
- 지도+패널+워크리스트 통합 레이아웃
- WCAG 2.2 AA 준수

## 안전
- DROP/DELETE 등 파괴적 작업 전 반드시 계획·확인
- RLS 정책 우선 설계
```

---

### `hvdc-logistics-ssot/SKILL.md`

```markdown
---
name: hvdc-logistics-ssot
description: HVDC 대시보드와 물류 대시보드 통합 프로젝트의 SSOT(문제정의·목표·UX·컴포넌트·검증 게이트) 참조 스킬.
---

## 목적(What)
통합 프로젝트 전반의 **단일 진실원(SSOT)**을 제공한다.

## 사용 시점(When)
- 요구사항 확인
- 설계/구현/검증 기준 정리
- 이해관계자 설명 자료 준비

## 입력(Inputs)
- references/SSOT.md

## 출력(Outputs)
- 요약, 의사결정 기준, 검증 체크포인트

## 절차(Workflow)
1. SSOT 문서를 우선 읽는다.
2. 충돌되는 정보가 있으면 SSOT를 기준으로 정리한다.
3. 요약 또는 체크리스트 형태로 재표현한다.

## 안전/보안
- SSOT에 없는 요구사항을 임의로 추가하지 않는다.

## 참조(References)
- references/SSOT.md
- references/QUICK_SUMMARY.md
```

### `hvdc-logistics-ssot/references/SSOT.md`

```markdown
# 통합 프로젝트 로드맵 및 시스템 문서 (SSOT)

(사용자가 제공한 전체 문서 원문을 그대로 포함)
```

### `hvdc-logistics-ssot/references/QUICK_SUMMARY.md`

```markdown
## 핵심 요약
- 단일 웹 앱에서 HVDC + 물류 통합
- Supabase 단일 저장소
- 지도(좌) + 상태 패널(우) + KPI/워크리스트(하)
- Gate1: 데이터 모델 / Gate2: UI·UX / Gate3: 성능
```

---

### `hvdc-logistics-planning/SKILL.md`

```markdown
---
name: hvdc-logistics-planning
description: HVDC·물류 통합 대시보드의 로드맵, README, 시스템 아키텍처 문서를 생성·갱신하는 스킬.
---

## 목적
SSOT를 기반으로 실행 가능한 계획과 문서를 만든다.

## 사용 시점
- 초기 설계
- 중간 점검
- Gate 통과 준비

## 출력
- ROADMAP.md
- ARCHITECTURE.md
- SYSTEM_LAYOUT.md

## 절차
1. hvdc-logistics-ssot를 참조한다.
2. 현재 repo 구조를 점검한다.
3. 문서 템플릿을 채운다.

## 참조
- references/DOC_OUTLINES.md
```

### `hvdc-logistics-planning/references/DOC_OUTLINES.md`

```markdown
## 문서 아웃라인
- README: 목적, 설치, 실행
- Architecture: 데이터·UI·API 구조
- Validation: Gate 기준, 지표
```

---

### `supabase-unified-schema/SKILL.md`

```markdown
---
name: supabase-unified-schema
description: Supabase 통합 스키마, RLS, Realtime 설계를 수행하는 스킬.
---

## 목적
HVDC·물류 데이터를 단일 스키마로 통합한다.

## 출력
- SQL 스키마
- 테이블 관계 정의

## 절차
1. 기존 테이블 인벤토리
2. 통합 스키마 설계
3. RLS 정책 정의
4. Realtime 대상 테이블 지정

## 안전
- DROP/DELETE 금지
- 마이그레이션 전 검토 필수

## 참조
- assets/schema_v1.sql
- references/DATA_MODEL.md
```

### `supabase-unified-schema/assets/schema_v1.sql`

```sql
-- 예시 스키마 (초안)
create table if not exists locations (
  id uuid primary key,
  name text,
  lat double precision,
  lng double precision
);

create table if not exists hvdc_worklist (
  id uuid primary key,
  status text,
  eta timestamptz
);
```

---

### `unified-dashboard-ui/SKILL.md`

```markdown
---
name: unified-dashboard-ui
description: 지도 기반 통합 대시보드 UI(MapView·RightPanel·Worklist)를 구현하는 스킬.
---

## 목적
일관된 UX의 통합 대시보드를 구현한다.

## 절차
1. 레이아웃(좌 지도 / 우 패널 / 하단 KPI)
2. 모바일 슬라이드 패널 적용
3. 접근성 점검(WCAG 2.2)

## 참조
- references/COMPONENT_SPEC.md
- references/A11Y_CHECKLIST.md
```

---

### `rdf-ttl-pipeline/SKILL.md`

```markdown
---
name: rdf-ttl-pipeline
description: HVDC JSON 데이터를 RDF(TTL)로 변환하고 정합성을 검증하는 스킬.
---

## 목적
관계형 데이터와 온톨로지 간 일관성 유지.

## 출력
- TTL 파일
- 사용 컬럼 로그

## 참조
- assets/columns.hvdc_status.example.json
- scripts/validate_used_cols.py
```

---

### `realtime-perf-testing/SKILL.md`

```markdown
---
name: realtime-perf-testing
description: Supabase Realtime 성능 및 부하 테스트를 수행하는 스킬.
---

## 목적
실시간 업데이트 성능 검증.

## 참조
- scripts/k6_api_smoke.js
- references/PERF_TEST_PLAN.md
```

---

### `handoff-docs-bundle/SKILL.md`

```markdown
---
name: handoff-docs-bundle
description: README, 환경 설정, 핸드오프 문서를 생성하는 스킬.
---

## 목적
운영·유지보수를 위한 문서 일괄 생성.

## 참조
- assets/env.example
- references/README_TEMPLATE.md
```

---

## 6) 설치 안내 (플랫폼별)

### OpenAI Codex

* Repo: `.codex/skills/<skill-name>/SKILL.md`
* User: `~/.codex/skills/<skill-name>/SKILL.md`
* Codex는 **Agent Skills 표준을 따르며 SKILL.md를 자동 로드**한다.

### Cursor

* Repo: `.cursor/skills/<skill-name>/SKILL.md`
* **현재 Nightly 빌드에서만 Agent Skills 지원**

### Claude Code

* Repo/User: `.claude/skills/<skill-name>/SKILL.md`
* `/skill-name`으로 명시 호출 가능

### VS Code (GitHub Copilot)

* Repo: `.github/skills/<skill-name>/SKILL.md` (권장)
* Personal: `~/.copilot/skills/<skill-name>/SKILL.md`

---

## 7) 검증 체크리스트

* [ ] skill name 규칙(소문자·하이픈·64자 이하) 충족
* [ ] SKILL.md에 YAML frontmatter 포함
* [ ] 과도한 장문은 references로 분리
* [ ] 보안 민감 값 미포함

### Validator 예시

```bash
pip3 install skills-ref
skills-ref validate agent-skills/
```

---

## 8) 참고 링크 / 근거 요약 (확인일: 2026‑01‑23)

* Agent Skills 오픈 표준(SKILL.md 규격)
* OpenAI Codex Skills 위치·동작
* Cursor Agent Skills(.cursor/skills, Nightly)
* Claude Code Skills(.claude/skills)
* VS Code Copilot Agent Skills(.github/skills)

---

위 패키지는 **제공하신 통합 문서를 SSOT로 삼아**, Cursor에서 바로 활용 가능한 **Codex Skill 풀 세트**입니다.
원하시면 다음 단계로 **특정 스킬(예: Supabase 스키마 또는 UI 스킬)만 확장**해 드릴 수 있습니다.
