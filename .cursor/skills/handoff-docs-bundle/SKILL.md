---
name: handoff-docs-bundle
description: README, CHANGELOG, SETUP, .env.example 등 핸드오프 문서를 템플릿으로 생성하는 스킬. 프로젝트 핸드오프, 새 팀원 온보딩, 배포 준비 시 사용.
---

## 목적
- 운영·유지보수용 문서 번들 생성하기.

## 입력
- `assets/env.example`
- `references/README_TEMPLATE.md`
- `references/CHANGELOG_TEMPLATE.md`
- `references/SETUP_TEMPLATE.md`
- `AGENTS.md`

## 출력
- `README.md`
- `.env.example`
- `CHANGELOG.md`
- `SETUP.md`

## 절차
1. `AGENTS.md` 규칙 먼저 확인하기.
2. 템플릿 파일을 로드해 프로젝트 정보로 채우기.
3. `assets/env.example`를 `.env.example`로 복사하고 필요한 변수 예시를 보완하기.
4. 결과물을 루트에 저장하기.

## 필수 참조
- [AGENTS.md](../../../AGENTS.md) - 프로젝트 규칙 확인하기.
- [SSOT.md](../hvdc-logistics-ssot/references/SSOT.md) - 단일 진실원 확인하기.

## 참조
- `assets/env.example`
- `references/README_TEMPLATE.md`
- `references/CHANGELOG_TEMPLATE.md`
- `references/SETUP_TEMPLATE.md`
