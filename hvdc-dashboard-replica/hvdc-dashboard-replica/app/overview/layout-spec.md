# HVDC Dashboard Layout Spec (2048 × 1365 artboard)

이 스펙은 첨부 이미지 기준으로 역산한 데스크톱 복제 레이아웃이다. 값은 **artboard px** 기준이다.  
실제 페이지는 `OverviewPage.tsx`의 `useArtboardScale()`로 비율 축소/확대된다.

## 1) Global
- Artboard: `2048 x 1365`
- Safe padding: `24px`
- Base radius: `22px`
- Outer frame radius: `30px`
- Primary font: `Inter / Segoe UI / system-ui`
- Base background: `#050A18`
- Primary text: `#F2F5FF`
- Secondary text: `#C7D0E8`
- Muted text: `#7C89A8`
- Divider line: `#1D2744`

## 2) Main boxes

| Box | x | y | w | h | Background | Notes |
|---|---:|---:|---:|---:|---|---|
| Sidebar rail | 0 | 0 | 110 | 1365 | deep navy gradient | active search chip at y=78 |
| Title | 138 | 29 | 500 | 36 | none | 26px semibold |
| Search input | 145 | 84 | 865 | 50 | dark blue panel | left icon + placeholder |
| Filter chip 1 | 1030 | 88 | 115 | 38 | active blue | Origin Arc |
| Filter chip 2 | 1162 | 88 | 113 | 38 | inactive dark | Voyage |
| Filter chip 3 | 1292 | 88 | 128 | 38 | active blue | Next 72h |
| Filter chip 4 | 1438 | 88 | 112 | 38 | inactive dark | Heatmap |
| Updated label | 1768 | 34 | 110 | 14 | none | top-right meta |
| Language pill | 1881 | 26 | 123 | 40 | dark pill | ENG active |

## 3) KPI row

| Card | x | y | w | h | Theme |
|---|---:|---:|---:|---:|---|
| Total Shipments | 146 | 135 | 278 | 127 | cool navy |
| Delivered to Site | 437 | 135 | 278 | 127 | cool navy |
| Open Radar | 727 | 135 | 323 | 127 | hot red |
| Overdue ETA | 1063 | 135 | 323 | 127 | hot red |
| MOSB Pending | 1398 | 135 | 318 | 127 | warm plum |
| AGI Readiness | 1727 | 135 | 279 | 127 | cool navy |

Typography:
- card title: `12px`, uppercase, `0.18em`
- card value: `30px`, semibold, `-0.05em`

## 4) Main map block

| Box | x | y | w | h | Notes |
|---|---:|---:|---:|---:|---|
| Map container | 132 | 293 | 1872 | 493 | rounded 28 |
| Left legend rail | 132 | 293 | 418 | 493 | contains route legend/filter |
| Large map image | 550 | 293 | 1454 | 493 | `/assets/hvdc-map-main.png` |

## 5) Section headers

| Header | x | y | w | h |
|---|---:|---:|---:|---:|
| Site Health Matrix | 145 | 806 | 1295 | 40 |
| Mission Control | 1476 | 806 | 472 | 40 |

## 6) Site health cards

| Card | x | y | w | h | Accent |
|---|---:|---:|---:|---:|---|
| SHU | 145 | 864 | 213 | 291 | `#58E1C9` |
| MIR | 374 | 864 | 213 | 291 | `#5C87FF` |
| DAS | 604 | 864 | 213 | 291 | `#8A58FF` |
| AGI main | 834 | 864 | 606 | 291 | `#F5D36F` |

Typography:
- label: `34px`
- value: `50px`
- caption: `13px`

## 7) Mission control panels

| Block | x | y | w | h |
|---|---:|---:|---:|---:|
| Critical Alerts | 1476 | 866 | 472 | 138 |
| Action Queue | 1476 | 1018 | 472 | 145 |
| Next 72 Hours | 1476 | 1178 | 472 | 144 |

## 8) Flow summary + bottom tabs

| Box | x | y | w | h |
|---|---:|---:|---:|---:|
| Flow summary | 145 | 1168 | 1295 | 101 |
| Tab: Logistics Chain | 145 | 1275 | 280 | 55 |
| Tab: Pipeline | 430 | 1275 | 220 | 55 |
| Tab: Sites | 654 | 1275 | 206 | 55 |
| Tab: Cargo | 864 | 1275 | 230 | 55 |

## 9) Fidelity notes
- `public/assets/hvdc-map-main.png` and `public/assets/hvdc-map-mini.png` are extracted from the provided screenshot for close visual parity.
- Remaining panels are rebuilt in code with gradients, borders, blur, and glow tokens.
- Literal 100% pixel identity still depends on using the same font, image compression, browser antialiasing, and asset pipeline.
