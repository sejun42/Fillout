# Fillout

캘린더 중심으로 운동을 기록하면서, 운동 이름만이 아니라 **머신 브랜드, 머신 이름, 안장 높이/패드 위치/각도 같은 세팅값까지 저장**할 수 있는 웹앱 MVP입니다.

기존 운동 기록 앱에서 아쉬운 점이었던 아래 문제를 해결하는 데 초점을 맞췄습니다.

- 헬스장마다 머신이 달라서 같은 운동이어도 세팅이 달라지는 문제
- 지난번 무게나 횟수는 기억나도 머신 세팅값은 남기기 어려운 문제
- 한 달 운동 흐름을 캘린더에서 빠르게 보고 싶은 니즈

## 한눈에 보기

- 월간 캘린더에서 날짜별 운동 부위를 색 점으로 확인
- 날짜를 눌러 세션 생성/수정
- 8분할 부위 체계 지원
- 기본 운동 라이브러리 제공
- 운동 / 브랜드 / 머신 직접 추가 가능
- 머신별 세팅 필드 기록 및 이전 세팅 자동 불러오기
- 세트별 무게 / 횟수 기록
- 이전 기록 복사
- 지난 세션 비교
- 주간 / 월간 통계
- 부족한 부위 추천 배너
- 모바일 우선 UI
- PWA 설치 지원

## 주요 화면

### 1. 홈 캘린더

- 월 단위 캘린더가 메인입니다.
- 각 날짜에는 해당 날짜에 수행한 부위를 색 점으로 표시합니다.
- 추천 배너와 최근 세션 요약을 함께 보여줍니다.

### 2. 세션 편집

- 날짜별로 세션을 만들고 수정할 수 있습니다.
- 부위를 여러 개 선택할 수 있습니다.
- 운동 추가, 머신 선택, 세팅값 입력, 세트 입력을 한 화면에서 처리합니다.
- 동일 운동 + 동일 머신 조합의 이전 기록이 있으면 세팅값과 세트값을 참고하거나 복사할 수 있습니다.

### 3. 라이브러리

- 기본 운동 / 브랜드 / 머신 목록을 볼 수 있습니다.
- 사용자 커스텀 운동, 브랜드, 머신을 직접 추가할 수 있습니다.
- 머신마다 사용할 세팅 필드를 선택할 수 있습니다.

### 4. 통계

- 지난 세션 대비 변화
- 최근 7일 기준 빈도 / 볼륨
- 월간 주차별 볼륨 추이
- 최근 4주 비교

### 5. 설정 / 로그인

- 데모 모드 또는 Supabase Auth 연결 모드로 진입할 수 있습니다.
- 현재 버전은 **환경 변수가 없으면 데모 데이터로 바로 사용 가능**합니다.

## 기술 스택

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Recharts
- Supabase Auth / PostgreSQL / RLS 준비
- Vercel 배포 전제
- PWA manifest / service worker 기본 설정

## 현재 구현 상태

이 저장소는 **바로 실행 가능한 MVP UI + 도메인 로직 + Supabase 스키마**까지 포함합니다.

현재 동작 방식은 두 가지입니다.

1. 데모 모드
- `.env.local` 없이도 실행됩니다.
- 로컬 스토리지에 세션/라이브러리 데이터가 저장됩니다.
- 화면 흐름과 기능 검증에 적합합니다.

2. Supabase 준비 모드
- Auth 연결 지점과 DB 스키마/RLS/seed SQL이 포함되어 있습니다.
- 세션/라이브러리 CRUD를 완전히 Supabase로 옮기는 작업은 다음 단계입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## 환경 변수

`.env.local` 파일을 만들고 아래 값을 넣으면 Supabase Auth 연결을 시도합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

예시 파일은 [`.env.example`](.env.example)에 있습니다.

## Supabase 적용 방법

1. [supabase/migrations/0001_mvp_schema.sql](supabase/migrations/0001_mvp_schema.sql)을 적용합니다.
2. [supabase/seed.sql](supabase/seed.sql)로 초기 데이터를 넣습니다.
3. Vercel과 로컬 환경 변수에 Supabase 값을 설정합니다.

포함된 스키마에는 아래가 들어 있습니다.

- `profiles`
- `body_parts`
- `exercise_definitions`
- `brand_definitions`
- `machine_definitions`
- `machine_setting_templates`
- `workout_sessions`
- `workout_session_body_parts`
- `session_exercises`
- `session_exercise_setting_values`
- `session_exercise_sets`
- RLS 정책
- `updated_at` 트리거

## 프로젝트 구조

```text
app/                  App Router routes
components/           Home, session editor, library, stats, settings UI
components/providers/ App state provider
lib/                  Date, stats, workout, mock-data utilities
supabase/             SQL migration and seed
types/                Domain types
public/               PWA assets
```

## 개발 명령어

```bash
npm run dev
npm run lint
npm run build
```

## 검증 상태

아래 명령 기준으로 통과했습니다.

```bash
npm run lint
npm run build
```

## 다음 작업 후보

- 세션/라이브러리 CRUD를 Supabase 실데이터로 전환
- Supabase RPC 또는 view 기반 통계 집계
- 서버/클라이언트 데이터 계층 분리
- 실제 배포용 아이콘 세트 및 OG 이미지 추가
- 최근 사용 운동 노출, 드래그 정렬 등 Nice to Have 반영
