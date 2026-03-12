# HVDC Status(SSOT) 변환 QA 리포트

- Status 입력: **874.00**
- Shipments 출력(SSOT 전량): **874.00**
- Coverage: **100.00%** (목표 100.00%)
- Warehouse 입력(row): **8804.00** (케이스 단위 row)
- Warehouse 매칭 성공(hvdc_code): **557.00**
- Orphan WH(매칭 실패 hvdc_code): **44.00** (비율 0.50%)

## 판정
- 결과: **PASS**

## 해석
- Coverage != 100.00% 이면: Status 로딩/필터/파싱 오류(SSOT 전량 출력 위반)
- Orphan WH > 0.00 이면: WH의 HVDC CODE가 Status의 SCT SHIP NO.와 불일치(키 정제 필요)