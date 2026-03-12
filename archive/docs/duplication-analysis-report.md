

```markdown:docs/DUPLICATION_ANALYSIS_REPORT.md
# 중복 내용 분석 리포트 (Duplication Analysis Report)

**작성일**: 2026-01-23
**분석 범위**: `.cursor`, `Logi ontol core doc`, `logi-cockpit-docs`, `logiontology_scaffold_2026-01-23`, `AGENTS.md`

---

## Executive Summary

프로젝트 내에서 **중복된 문서와 구조**가 발견되었습니다. 주요 중복 사항:

1. **logi-cockpit-docs 중첩 구조** (Critical)
2. **AGENTS.md 중복** (High)
3. **문서 디렉토리 중복** (Medium)
4. **온톨로지 문서 중복** (Low)

---

## 1. Critical: logi-cockpit-docs 중첩 구조

### 발견 사항

```
logi-cockpit-docs/
├── AGENTS.md                    # 125줄
├── README.md                    # 110줄
├── STATUS.md
├── docs/                        # 6개 파일
│   ├── ARCHITECTURE.md
│   ├── COMPONENTS.md
│   ├── LAYOUT.md
│   ├── MIGRATION_GUIDE.md
│   ├── ROADMAP.md
│   └── TEST_PLAN.md
└── logi-cockpit-docs/           # ⚠️ 완전 중복
    ├── AGENTS.md                # 동일 내용
    ├── README.md                # 동일 내용
    ├── STATUS.md                # 동일 내용
    └── docs/                    # 동일 6개 파일
        ├── ARCHITECTURE.md
        ├── COMPONENTS.md
        ├── LAYOUT.md
        ├── MIGRATION_GUIDE.md
        ├── ROADMAP.md
        └── TEST_PLAN.md
```

### 영향

- **디스크 공간 낭비**: 동일 파일 2배
- **유지보수 복잡도 증가**: 어느 것이 SSOT인지 불명확
- **혼란**: 개발자가 잘못된 파일을 수정할 위험

### 권장 조치

**즉시 실행**:
```bash
# 중첩 디렉토리 삭제
rm -rf logi-cockpit-docs/logi-cockpit-docs
```

**근거**:
- 루트 `logi-cockpit-docs/`가 SSOT
- 중첩 구조는 실수로 생성된 것으로 보임

---

## 2. High: AGENTS.md 중복

### 발견 사항

| 파일 경로 | 줄 수 | 내용 | SSOT 여부 |
|-----------|-------|------|-----------|
| `AGENTS.md` (루트) | 347줄 | 상세한 통합 가이드 (Supabase↔Foundry, RDF 파이프라인, 보안 등) | ✅ **SSOT** |
| `logi-cockpit-docs/AGENTS.md` | 125줄 | 간결한 통합 레포 가이드 (성능 우선순위, Date Canon, 프론트엔드 규칙) | ⚠️ 부분 중복 |
| `docs/AGENTS.md` | 1줄 | "This mirrors root AGENTS.md. Root is SSOT." | ✅ 미러 (정상) |

### 내용 비교

#### 공통 내용
- Monorepo 구조
- Supabase SSOT
- Date Canon 개념
- 성능 우선순위

#### 차이점

**루트 AGENTS.md (347줄)**:
- Supabase ↔ Foundry/Ontology 통합 패턴 (4가지)
- RDF(Turtle) 파이프라인 상세
- 보안/Compliance 상세
- 테스트/QA 가이드
- Agent Safety & Permissions

**logi-cockpit-docs/AGENTS.md (125줄)**:
- 성능 우선순위 7단계 (Async Waterfall 제거 등)
- 프론트엔드 규칙 (Map 번들, 데이터 페칭, 상태 관리)
- 백엔드/DB 규칙
- PR 운영 규칙
- 에이전트 출력 포맷

### 권장 조치

**옵션 A: 통합 (권장)**
- 루트 `AGENTS.md`에 `logi-cockpit-docs/AGENTS.md`의 고유 내용 통합
- `logi-cockpit-docs/AGENTS.md` 삭제 또는 루트 참조로 변경

**옵션 B: 분리 유지**
- 루트 `AGENTS.md`: 전체 프로젝트 가이드
- `logi-cockpit-docs/AGENTS.md`: 통합 레포 특화 가이드 (참조용)
- 명확한 SSOT 표시 필요

---

## 3. Medium: 문서 디렉토리 중복

### 발견 사항

```
logi-cockpit-docs/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── COMPONENTS.md
│   ├── LAYOUT.md
│   ├── MIGRATION_GUIDE.md
│   ├── ROADMAP.md
│   └── TEST_PLAN.md
└── logi-cockpit-docs/docs/      # ⚠️ 중복 (중첩 구조 제거 시 함께 해결)
    └── (동일 6개 파일)
```

### 권장 조치

- 중첩 구조 제거 시 자동 해결

---

## 4. Low: 온톨로지 문서 중복

### 발견 사항

| 파일/디렉토리 | 내용 | 중복 여부 |
|---------------|------|-----------|
| `온톨리지.MD` | 한글 파일명, Site Arrival Date 관련 | ⚠️ 부분 중복 |
| `Logi ontol core doc/CORE_DOCUMENTATION_MASTER.md` | 온톨로지 마스터 문서 (2,710줄) | ✅ 고유 |
| `Logi ontol core doc/FLOW_CODE_V35_QUICK_REFERENCE.md` | Flow Code 빠른 참조 | ✅ 고유 |
| `Logi ontol core doc/FLOW_CODE_V35_INTEGRATION_REPORT.md` | Flow Code 통합 리포트 | ✅ 고유 |

### 분석

**`온톨리지.MD`**:
- Site Arrival Date 관련 내용
- `Logi ontol core doc/CONSOLIDATED-02-warehouse-flow.md`와 부분 중복 가능
- 한글 파일명으로 인한 접근성 저하

### 권장 조치

**옵션 A: 통합**
- `온톨리지.MD` 내용을 `Logi ontol core doc/`로 이동
- 한글 파일명을 영문으로 변경

**옵션 B: 유지**
- `온톨리지.MD`를 참조용으로 유지
- SSOT는 `Logi ontol core doc/`로 명시

---

## 5. 중복 제거 우선순위

### Priority 1: 즉시 실행 (Critical)

1. **logi-cockpit-docs 중첩 구조 제거**
   ```bash
   rm -rf logi-cockpit-docs/logi-cockpit-docs
   ```
   - 예상 시간: 1분
   - 리스크: 낮음 (중복 파일)

### Priority 2: 단기 실행 (High)

2. **AGENTS.md 통합**
   - 루트 `AGENTS.md`에 `logi-cockpit-docs/AGENTS.md` 고유 내용 통합
   - `logi-cockpit-docs/AGENTS.md`를 루트 참조로 변경
   - 예상 시간: 1-2시간
   - 리스크: 중간 (내용 검토 필요)

### Priority 3: 중기 실행 (Medium)

3. **온톨리지.MD 정리**
   - 내용 검토 후 `Logi ontol core doc/`로 통합 또는 참조 링크 추가
   - 예상 시간: 30분
   - 리스크: 낮음

---

## 6. SSOT 명확화 권장 사항

### 문서 계층 구조

```
루트/
├── AGENTS.md                    # ✅ SSOT (전체 프로젝트 코딩 규칙)
├── STATUS.md                    # ✅ SSOT (통합 상태)
├── docs/
│   ├── INTEGRATION_ROADMAP.md   # ✅ SSOT (통합 로드맵)
│   └── architecture.md           # ✅ SSOT (시스템 아키텍처)
├── logi-cockpit-docs/           # ⚠️ 참조용 (통합 설계 문서)
│   ├── README.md                # 참조용 (SSOT 아님)
│   └── docs/                    # 참조용 (SSOT 아님)
└── Logi ontol core doc/         # ✅ SSOT (온톨로지 문서)
    └── CORE_DOCUMENTATION_MASTER.md
```

### 각 문서에 SSOT 표시 추가

**권장 형식**:
```markdown
> **SSOT**: 이 문서는 [참조 문서]의 SSOT입니다.
> **참조**: [다른 관련 문서]
```

---

## 7. 실행 계획

### Step 1: 중첩 구조 제거 (즉시)

```bash
# Windows PowerShell
Remove-Item -Recurse -Force "logi-cockpit-docs\logi-cockpit-docs"

# Linux/Mac
rm -rf logi-cockpit-docs/logi-cockpit-docs
```

### Step 2: AGENTS.md 통합 (1-2시간)

1. `logi-cockpit-docs/AGENTS.md`의 고유 내용 추출
2. 루트 `AGENTS.md`에 통합
3. `logi-cockpit-docs/AGENTS.md`를 루트 참조로 변경

### Step 3: 문서 SSOT 표시 추가 (30분)

각 문서에 SSOT/참조 표시 추가

---

## 8. 검증 체크리스트

중복 제거 후:

- [ ] `logi-cockpit-docs/logi-cockpit-docs/` 디렉토리 없음
- [ ] 루트 `AGENTS.md`에 성능 우선순위 포함
- [ ] 모든 문서에 SSOT/참조 표시 명확
- [ ] Git 상태 확인 (변경 사항 커밋)

---

## 9. 참조 문서

- [STATUS.md](../STATUS.md) - 통합 상태 SSOT
- [AGENTS.md](../AGENTS.md) - 코딩 규칙 SSOT
- [INTEGRATION_ROADMAP.md](./INTEGRATION_ROADMAP.md) - 통합 로드맵 SSOT

---

**문서 버전**: 1.0
**최종 업데이트**: 2026-01-23
```

## 중복 내용 분석 리포트 완료

### 주요 발견 사항

1. Critical: logi-cockpit-docs 중첩 구조
   - `logi-cockpit-docs/logi-cockpit-docs/` 완전 중복
   - 즉시 삭제 권장

2. High: AGENTS.md 중복
   - 루트 `AGENTS.md` (347줄) - SSOT
   - `logi-cockpit-docs/AGENTS.md` (125줄) - 부분 중복
   - 통합 또는 명확한 SSOT 표시 필요

3. Medium: 문서 디렉토리 중복
   - 중첩 구조 제거 시 자동 해결

4. Low: 온톨리지 문서
   - `온톨리지.MD` (한글 파일명) 부분 중복 가능
   - 정리 권장

### 즉시 실행 가능한 작업

1. 중첩 구조 제거
   ```powershell
   Remove-Item -Recurse -Force "logi-cockpit-docs\logi-cockpit-docs"
   ```

2. AGENTS.md 통합 계획 수립

어떤 작업부터 진행할까요?

- A) 중첩 구조 제거 (즉시 실행)
- B) AGENTS.md 통합 계획 수립
- C) 전체 중복 제거 스크립트 작성
