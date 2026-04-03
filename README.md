# Fillout

Fillout은 캘린더 중심으로 운동을 기록하면서, 운동명만이 아니라 머신 브랜드, 머신명, 안장 높이, 패드 위치, 각도 같은 세팅값까지 함께 남길 수 있는 운동 기록 웹앱입니다.

이 저장소의 현재 버전은 Next.js + TypeScript + Tailwind + Supabase + PWA 기반 MVP입니다. 로그인한 사용자는 Supabase에 데이터를 저장하므로 여러 기기에서 같은 계정으로 기록을 이어서 볼 수 있습니다.

## 핵심 기능

- 월간 캘린더에서 날짜별 운동 부위를 색 점으로 확인
- 날짜별 세션 생성, 수정, 삭제
- 8분할 부위 체계 지원
- 기본 운동 라이브러리 제공
- 커스텀 운동 추가
- 머신 브랜드, 머신, 세팅 템플릿 추가
- 같은 운동 + 같은 머신 기준 이전 세팅 자동 프리필
- 이전 세트 기록 복사
- 지난 세션 비교
- 주간 / 월간 통계
- 최근 빈도가 낮은 부위 추천 배너
- PWA 설치 지원

## 이번 업데이트

### 1. 기기간 동기화

- 이메일 로그인 후 저장하는 세션, 운동, 브랜드, 머신 정보가 Supabase를 통해 계정 기준으로 동기화됩니다.
- 다른 기기에서 같은 계정으로 로그인하면 같은 데이터가 로드됩니다.
- 앱이 다시 포커스를 얻거나 온라인 상태로 돌아오면 원격 상태를 다시 불러옵니다.

### 2. 공용 머신 / 브랜드 라이브러리

- 로그인 상태에서 새로 추가한 브랜드는 공용 라이브러리에 저장됩니다.
- 로그인 상태에서 새로 추가한 머신과 머신 세팅 템플릿도 공용 라이브러리에 저장됩니다.
- 다른 사용자도 이후 해당 브랜드와 머신을 선택해서 사용할 수 있습니다.
- 같은 브랜드 + 같은 머신명이 이미 있으면 중복 생성하지 않도록 처리했습니다.

### 3. PWA 보강

- `manifest.webmanifest` 구성 보완
- 192 / 512 아이콘 및 Apple 아이콘 적용
- 서비스 워커 등록 및 앱 셸 캐싱 적용
- iOS / Android 설치 흐름을 고려한 메타 태그 추가

## 기술 스택

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Recharts
- Supabase Auth / PostgreSQL / RLS
- Vercel
- PWA

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속하면 됩니다.

## 환경 변수

프로젝트 루트에 `.env.local` 파일을 두고 아래 값을 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

예시 파일은 [`.env.example`](/D:/Fillout/fillout-app/.env.example)에 있습니다.

## Supabase 설정

이미 기본 스키마를 적용했다면, 이번 버전에서는 추가 마이그레이션까지 적용해야 공용 머신 / 브랜드 동작이 완성됩니다.

실행 순서:

1. [0001_mvp_schema.sql](/D:/Fillout/fillout-app/supabase/migrations/0001_mvp_schema.sql) 실행
2. [seed.sql](/D:/Fillout/fillout-app/supabase/seed.sql) 실행
3. [0002_shared_catalog_and_sync.sql](/D:/Fillout/fillout-app/supabase/migrations/0002_shared_catalog_and_sync.sql) 실행

`0002` 마이그레이션이 하는 일:

- `brand_definitions.is_shared` 추가
- `machine_definitions.is_shared` 추가
- 시스템 브랜드 / 머신을 공용 항목으로 마킹
- 공용 브랜드 / 머신 / 머신 템플릿을 전체 읽기 가능하게 RLS 정책 갱신

## Auth 설정

Supabase Dashboard에서 아래를 확인해야 합니다.

- `Authentication > URL Configuration`
  - `Site URL`: 로컬은 `http://localhost:3000`
  - `Redirect URLs`: `http://localhost:3000/**`
  - 배포 후 Vercel URL도 추가
- `Authentication > Sign In / Providers > Email`
  - Email provider 활성화
  - 회원가입 허용
  - 테스트 중이면 필요에 따라 이메일 확인 비활성화

## 데이터 저장 방식

### 데모 모드

- 로그인 없이 바로 체험 가능
- 브라우저 `localStorage` 기반
- 데모 데이터 포함

### 로그인 모드

- Supabase Auth 사용
- 세션 / 운동 / 브랜드 / 머신 데이터가 계정 기준으로 Supabase에 저장
- 여러 기기에서 동기화 가능

## PWA 사용 방법

### Android / Chromium 계열

- 주소창 메뉴에서 `Install` 또는 `앱 설치`
- 또는 앱 내 설치 배너 사용

### iPhone / iPad

- Safari에서 열기
- 공유 메뉴 선택
- `홈 화면에 추가` 선택

## 폴더 구조

```text
app/                  App Router 페이지와 메타데이터
components/           홈, 세션 편집, 라이브러리, 통계, 설정 UI
components/providers/ 앱 상태 및 Supabase 동기화
lib/                  날짜, 통계, 운동, Supabase 유틸
supabase/             SQL migration / seed
types/                도메인 타입과 Supabase 타입
public/               PWA 자산과 서비스 워커
```

## 개발 명령어

```bash
npm run dev
npm run lint
npm run build
```

## 검증 상태

현재 아래 명령을 통과합니다.

```bash
npm run lint
npm run build
```

## 배포

권장 배포 구성:

- Frontend: Vercel
- Auth / DB: Supabase

배포 전 체크리스트:

1. Supabase 환경 변수 등록
2. `0001`, `seed`, `0002` SQL 적용
3. Auth Redirect URL 등록
4. Vercel 환경 변수 등록
5. 배포 후 로그인, 세션 저장, 다른 기기 로그인, PWA 설치 확인
