# Feature Spec — 검색창(ref no / name)

## 요구사항
검색창을 대시보드에 삽입한다.
- 입력: ref no / name
  - 예: `sct-0011`, `he-0212`, `case123453`, `mir`
- 결과: 관련 항목(Shipment/Case/Location)을 보여주고, 선택 시 해당 상세로 이동

## 구현 방향(v1)
- **클라이언트 인메모리 검색**(빠르고 RLS 영향 없음)
  - 데이터 소스: `worklistRows` + `POI_LOCATIONS`
  - 제한: 현재 로딩된 worklist에 없는 과거/전체 데이터는 검색 불가
- v2(옵션): `/api/search?q=` + Postgres FTS/Trigram 인덱스로 확장(RLS 유지)

## UX 사양
- 위치: HeaderBar 우측(또는 중앙) — 모바일에서도 보이되 너비를 자동 조절
- Debounce: 150~200ms
- Keyboard: ↑/↓ 이동, Enter 선택, Esc 닫기
- 결과 타입 배지: Shipment/Case/Location
- No matches 상태 메시지

## 접근성
- `role="combobox"` + `listbox` 패턴
- `sr-only` label 제공
- 포커스 이동 시 dropdown이 닫히지 않도록 onBlur 지연 처리

## 구현 파일
- `apps/logistics-dashboard/lib/search/searchIndex.ts`
- `apps/logistics-dashboard/components/search/GlobalSearch.tsx`

## 통합 방법(필수 수정)
HeaderBar(또는 UnifiedLayout 상단)에서 `GlobalSearch`를 렌더링하고, 선택 시 라우팅/선택 처리:

```tsx
const items = useMemo(() => buildSearchIndex({ worklistRows, pois: POI_LOCATIONS }), [worklistRows]);

<GlobalSearch
  items={items}
  onSelect={(res) => {
    switch(res.type){
      case 'shipment': router.push(`?focus=${res.payload.hvdc_code}`); break;
      case 'case': router.push(`?case=${res.payload.case_no}`); break;
      case 'location': router.push(`?loc=${res.payload.poi_code}`); break;
    }
  }}
/>
```
