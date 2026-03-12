# Vercel 배포 성공 리포트

**작성일**: 2026-01-25  
**프로젝트**: LOGI MASTER DASH  
**배포 플랫폼**: Vercel  
**상태**: ✅ 성공

---

## 📋 배포 정보

### 프로덕션 URL
- **메인 URL**: https://logimasterdash-rkz2dqsc8-chas-projects-08028e73.vercel.app/
- **프로젝트 이름**: logimasterdash
- **조직**: chas-projects-08028e73
- **프로젝트 ID**: prj_CyMxrDwEZspQ0IFbTLtBUw1dw68U

### 배포 설정
- **프레임워크**: Next.js 16.0.10
- **패키지 관리자**: pnpm 10.28.0
- **빌드 시스템**: Turborepo
- **Monorepo 구조**: apps/logistics-dashboard

---

## 🔧 해결된 문제들

### 1. Next.js 감지 실패

**문제**:
```
Error: No Next.js version detected. Make sure your package.json has "next" 
in either "dependencies" or "devDependencies".
```

**원인**:
- Vercel이 루트 디렉토리에서 `package.json`을 확인했지만, Next.js 앱은 `apps/logistics-dashboard`에 위치
- 루트 `package.json`에 Next.js 의존성이 없어서 Vercel이 프레임워크를 감지하지 못함

**해결**:
- 루트 `package.json`의 `devDependencies`에 `next: "16.0.10"` 추가
- Vercel이 Next.js를 감지할 수 있도록 함

**변경사항**:
```json
{
  "devDependencies": {
    "next": "16.0.10",
    "turbo": "^2.4.0"
  }
}
```

---

### 2. pnpm 워크스페이스 해결 실패

**문제**:
```
x Could not resolve workspaces.
`-> Missing `packageManager` field in package.json
```

**원인**:
- pnpm이 워크스페이스 구조를 해결하기 위해 `packageManager` 필드가 필요
- 이전에 Turborepo 호환성 문제로 제거했던 필드가 실제로는 필요했음

**해결**:
- 루트 `package.json`에 `packageManager: "pnpm@10.28.0"` 필드 추가

**변경사항**:
```json
{
  "packageManager": "pnpm@10.28.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

---

### 3. Monorepo 빌드 설정

**문제**:
- Vercel이 monorepo 구조를 인식하지 못함
- 빌드 명령과 출력 디렉토리가 명시되지 않음

**해결**:
- `vercel.json` 파일 생성하여 monorepo 빌드 설정 명시

**최종 `vercel.json` 설정**:
```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm --filter @repo/logistics-dashboard build",
  "outputDirectory": "apps/logistics-dashboard/.next"
}
```

**설명**:
- `framework`: Next.js 프레임워크 명시
- `installCommand`: pnpm을 사용한 의존성 설치
- `buildCommand`: pnpm 필터를 사용하여 특정 워크스페이스만 빌드
- `outputDirectory`: Next.js 빌드 출력 디렉토리 지정

---

### 4. Git 서브모듈 경고

**문제**:
```
Warning: Failed to fetch one or more git submodules
```

**원인**:
- `archive/legacy/hvdc-dash` 디렉토리가 내장된 git 저장소로 인식됨
- Vercel이 서브모듈로 인식하여 페치 시도

**해결**:
- `archive/legacy/hvdc-dash` 디렉토리에서 `.git` 폴더 제거
- Git 인덱스에서 제거 후 일반 파일로 재추가
- `.gitmodules` 파일이 없음을 확인

**명령어**:
```bash
git rm -r --cached archive/legacy/hvdc-dash
rm -rf archive/legacy/hvdc-dash/.git
git add archive/legacy/hvdc-dash
git commit -m "fix: remove embedded git repository from archive/legacy/hvdc-dash"
```

---

### 5. Vercel 스키마 검증 오류

**문제**:
```
The vercel.json schema validation failed with the following message: 
should NOT have additional property `rootDirectory`
```

**원인**:
- `rootDirectory`는 `vercel.json`에서 지원하지 않는 속성
- Vercel 대시보드에서만 설정 가능

**해결**:
- `vercel.json`에서 `rootDirectory` 제거
- Vercel 대시보드에서 Root Directory를 `apps/logistics-dashboard`로 설정하도록 안내

**참고**: Root Directory는 Vercel 대시보드에서 설정해야 합니다:
- Settings → General → Root Directory → `apps/logistics-dashboard`

---

## 📁 최종 프로젝트 구조

```
LOGI MASTER DASH/
├── package.json              # 루트 package.json (next, packageManager 포함)
├── vercel.json               # Vercel 배포 설정
├── pnpm-lock.yaml            # pnpm 락 파일
├── turbo.json                # Turborepo 설정
├── apps/
│   ├── logistics-dashboard/  # 배포 대상 앱
│   │   ├── package.json      # Next.js 16.0.10
│   │   ├── next.config.mjs
│   │   └── .next/            # 빌드 출력
│   └── hvdc-dashboard/        # 다른 앱
├── packages/
│   ├── shared/
│   └── ui-components/
└── scripts/
    └── vercel-deployment-diagnostic.ps1  # 배포 진단 스크립트
```

---

## ✅ 검증된 설정

### 루트 package.json
```json
{
  "name": "logi-master-dash",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@10.28.0",
  "workspaces": ["apps/*", "packages/*"],
  "devDependencies": {
    "next": "16.0.10",
    "turbo": "^2.4.0"
  },
  "pnpm": {
    "overrides": {
      "next": "16.1.1",
      "react": "19.2.3",
      "react-dom": "19.2.3"
    }
  }
}
```

### vercel.json
```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm --filter @repo/logistics-dashboard build",
  "outputDirectory": "apps/logistics-dashboard/.next"
}
```

### apps/logistics-dashboard/package.json
```json
{
  "name": "@repo/logistics-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "next build",
    "dev": "next dev -p 3001"
  },
  "dependencies": {
    "next": "16.0.10",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  }
}
```

---

## 🔍 배포 진단 스크립트

배포 설정을 검증하는 PowerShell 스크립트를 생성했습니다:

**파일**: `scripts/vercel-deployment-diagnostic.ps1`

**실행 방법**:
```powershell
.\scripts\vercel-deployment-diagnostic.ps1
```

**검증 항목**:
1. 루트 `package.json`에 Next.js 의존성 존재 여부
2. `packageManager` 필드 존재 여부
3. `vercel.json` 설정 유효성
4. 앱 `package.json`에 Next.js 및 빌드 스크립트 존재 여부
5. 디렉토리 구조 정확성
6. Vercel 프로젝트 링크 상태

---

## 📝 커밋 이력

배포 성공을 위한 주요 커밋들:

1. `fix: add packageManager field to root package.json for pnpm workspace resolution`
   - `packageManager: "pnpm@10.28.0"` 추가

2. `fix: add vercel.json with monorepo build configuration (no rootDirectory)`
   - `vercel.json` 생성

3. `fix: use @repo/logistics-dashboard package name in vercel.json buildCommand`
   - 빌드 명령에서 정확한 패키지 이름 사용

4. `fix: add next dependency to root package.json for Vercel Next.js detection`
   - 루트 `package.json`에 `next` 의존성 추가

5. `docs: record successful Vercel deployment`
   - 배포 성공 문서화

---

## 🎯 핵심 교훈

### Monorepo 배포 시 주의사항

1. **루트 package.json에 프레임워크 의존성 추가**
   - Vercel이 프레임워크를 감지할 수 있도록 루트에 프레임워크 의존성 필요
   - `devDependencies`에 추가해도 충분

2. **packageManager 필드 필수**
   - pnpm 워크스페이스를 사용하는 경우 `packageManager` 필드 필수
   - 버전을 명시하여 일관성 보장

3. **vercel.json에서 rootDirectory 사용 불가**
   - `rootDirectory`는 Vercel 대시보드에서만 설정 가능
   - `vercel.json`에는 빌드 명령과 출력 디렉토리만 명시

4. **pnpm 필터 사용**
   - monorepo에서 특정 워크스페이스만 빌드하려면 `pnpm --filter` 사용
   - 패키지 이름 또는 디렉토리 경로로 필터링 가능

5. **서브모듈 제거**
   - 내장된 git 저장소는 서브모듈로 인식되어 경고 발생
   - `.git` 폴더를 제거하고 일반 파일로 처리

---

## 🔗 관련 링크

- **Vercel 프로젝트**: https://vercel.com/chas-projects-08028e73/logimasterdash
- **배포 URL**: https://logimasterdash-rkz2dqsc8-chas-projects-08028e73.vercel.app/
- **프로젝트 설정**: https://vercel.com/chas-projects-08028e73/logimasterdash/settings
- **배포 로그**: https://vercel.com/chas-projects-08028e73/logimasterdash/deployments

---

## 📚 참고 문서

- [Vercel Monorepo 가이드](https://vercel.com/docs/deployments/monorepos)
- [Vercel Build 설정](https://vercel.com/docs/builds/configure-a-build)
- [pnpm Workspace 문서](https://pnpm.io/workspaces)
- [Turborepo 문서](https://turbo.build/repo/docs)

---

**최종 업데이트**: 2026-02-07  
**작성자**: AI Assistant  
**상태**: ✅ 배포 성공 및 문서화 완료

**최근 변경사항** (2026-02-05~2026-02-07):
- UI/UX 개선 완료: 히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 헤더 고정, 워크리스트 간소화
- 대시보드 기능 향상: 레이아웃 간격 조정, 접근성 개선, 성능 최적화
