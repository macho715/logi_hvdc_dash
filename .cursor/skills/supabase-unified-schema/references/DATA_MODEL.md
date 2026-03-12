## 데이터 모델 개요

### Core Tables
- **locations**: 물류 위치 (포트, 창고, 현장)
- **location_statuses**: 위치별 실시간 상태
- **events**: 이벤트 로그
- **hvdc_worklist**: HVDC 워크리스트
- **hvdc_kpis**: HVDC KPI 메트릭
- **logs**: 시스템 로그

### 관계
- locations (1) → (N) location_statuses
- locations (1) → (N) events

### 제약사항
- pressure ≤ 4.0 t/m² (안전 기준)
- RLS 필수 (보안)
- Realtime 구독은 필요한 테이블만

### 마이그레이션 원칙
- 기존 데이터 보존
- 점진적 마이그레이션
- 롤백 계획 필수
