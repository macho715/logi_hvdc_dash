# @repo/shared

공유 타입 및 Store 패키지

## 사용법

```typescript
import { useOpsActions, useSelectedCaseId, useWorklistRows } from "@repo/shared";

// Actions 사용
const actions = useOpsActions();
actions.selectCase("CASE_001");

// Atomic selectors
const selectedCaseId = useSelectedCaseId();
const rows = useWorklistRows();
```

## 구조

- `src/types/` - 공유 타입 정의
- `src/store/` - 통합 Store (OpsStore)

## Zustand v5 주의사항

- 여러 값을 한 번에 구독할 때는 `useShallow` 사용 권장
- atomic selector hooks를 기본으로 사용
