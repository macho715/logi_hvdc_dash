# AGENTS.md 100% 준수형 v3 패치 노트

## 적용
- Overview source = `hvdc all status` only
- Detail source = `wh status + Flow Code`
- Overview stage = milestone-based only
- Global path = `Origin -> POL -> POD -> Site`
- UAE Ops path = `POD -> Customs -> WH(optional) -> MOSB(optional) -> Site`
- planned vs actual separated
- actual overrides planned
- vendor dynamic distinct
- WH optional
- detail outputs separated

## 변경 포인트
### Python
- `has_mosb` 제거
- `mosb_milestone` 추가
- `offshore_routing_required` 추가
- `global_map.json`에 `origin_to_pol / pol_to_pod / pod_to_site` 추가
- detail JSON 3종 추가

### React
- Global view를 4-column으로 변경
- stage color를 노드 의미 색상과 분리
- mode default = `uae_ops`
- assumptions panel 추가

## 검수 체크
- [ ] overview에서 `FLOW_CODE` 참조가 없는가
- [ ] Global에 `POL` 노드가 보이는가
- [ ] AGI/DAS가 UAE Ops에서 MOSB를 경유하는가
- [ ] SHU/MIR은 direct 또는 WH 경유로 보이는가
- [ ] All Vendors가 동적 값으로 생성되는가
- [ ] detail JSON이 `wh status`에서 생성되는가
