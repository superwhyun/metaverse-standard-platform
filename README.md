# 메타버스 국제표준화 동향 및 표준 검색 플랫폼

통합 캘린더 기반 인터페이스에서 국제 표준회의 일정을 추적하고, 표준화 동향 보고서를 검색·분류·관리할 수 있는 웹 애플리케이션입니다.

## 🚀 프로젝트 개요

- 국제 표준회의 일정 조회 및 알림
- 표준화 동향 보고서 리스트 및 상세 뷰
- 관리자 모드를 통한 회의·보고서·카테고리 CRUD
- OpenAI/자체 분류 엔진을 활용한 태깅·분석

자세한 요구사항은 [PRD.md](PRD.md)를 참고하세요.

## 🎯 주요 기능

- **캘린더 뷰**: 월별 일정·보고서 유무 표시, 날짜 클릭 시 팝업
- **보고서 페이지**: 필터·정렬, 무한 스크롤, 상세 콘텐츠 뷰어
- **관리자 대시보드**: 인증 후 회의·보고서·카테고리·조직 정보 관리
- **표준 검색/분석**: AI 기반 분류·태그, 통합 검색 UI

## 🛠 기술 스택

- 프레임워크: Next.js 15 (App Router)
- 언어: TypeScript, React
- 스타일: Tailwind CSS, shadcn UI
- 데이터베이스: Cloudflare D1 (추상화 레이어 지원)
- 캐시: Cloudflare KV (표준 검색 캐시)
- 인증: NextAuth.js
- 배포: Cloudflare Pages
- 빌드: @cloudflare/next-on-pages

## 📂 디렉터리 구조

```
├─ app/                # Next.js 페이지·레이아웃
├─ components/         # 화면별 및 공통 UI 컴포넌트
│  └─ ui/              # shadcn UI primitives
├─ lib/                # DB 어댑터·인증·암호화·OpenAI 유틸
├─ hooks/              # React 커스텀 훅
├─ migrations/         # SQL 마이그레이션
├─ types/              # 전역 타입 선언
├─ config/             # 네비게이션·환경 설정
├─ public/             # 정적 리소스
├─ styles/             # 전역 CSS
└─ utils/              # 범용 유틸리티
```

## 🔧 로컬 개발 환경 설정

### 1. 리포지토리 클론 및 의존성 설치
```bash
git clone https://github.com/superwhyun/metaverse-standard-platform.git
cd metaverse-standard-platform
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일에 다음 값들을 입력하세요:

```ini
# 필수 환경 변수
NEXTAUTH_SECRET="임의의_긴_랜덤_문자열"  # openssl rand -base64 32 명령으로 생성 가능
NEXTAUTH_URL="http://localhost:3000"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="원하는_관리자_비밀번호"

# 선택 환경 변수 (AI 기능 사용 시)
ANTHROPIC_API_KEY="sk-ant-api03-..."
OPENAI_API_KEY="sk-proj-..."
PERPLEXITY_API_KEY="pplx-..."
```

### 3. Wrangler 로그인 (Cloudflare Pages 로컬 개발 시)

Cloudflare Pages 로컬 환경을 사용하려면 wrangler 인증이 필요합니다:
```bash
npx wrangler login
# 브라우저가 열리며 Cloudflare 계정으로 로그인
```

### 4. 데이터베이스 마이그레이션

**로컬 SQLite 데이터베이스를 사용하는 경우:**
```bash
# DB-SYNC.md 가이드 참고
npm run sync-db
```

**Cloudflare D1을 사용하는 경우:**
```bash
# 1. D1 데이터베이스 생성 (최초 1회)
npx wrangler d1 create metaverse-standards-dev

# 2. wrangler.toml 파일에서 database_id 업데이트
# 생성된 database_id를 복사하여 wrangler.toml의 [[d1_databases]] 섹션에 입력

# 3. KV namespace 생성 (최초 1회)
npx wrangler kv:namespace create "STANDARD_SEARCH_CACHE"

# 4. wrangler.toml 파일에서 KV namespace id 업데이트
# 생성된 id를 복사하여 wrangler.toml의 [[kv_namespaces]] 섹션에 입력

# 5. migrations 디렉터리의 SQL 파일들을 순서대로 실행
npx wrangler d1 execute metaverse-standards-dev --file=./migrations/001_initial_schema.sql
# 추가 마이그레이션 파일이 있다면 순서대로 실행
```

> `wrangler.toml` 파일에는 이미 프로젝트 설정이 포함되어 있습니다. 새로운 D1/KV를 생성한 경우 해당 ID만 업데이트하면 됩니다.

### 5. 개발 서버 실행

**옵션 A: 표준 Next.js 개발 서버 (빠른 개발)**
```bash
npm run dev
# http://localhost:3000 에서 확인
```

**옵션 B: Cloudflare Pages 로컬 환경 (프로덕션과 동일한 환경)**
```bash
# 1단계: Cloudflare Pages용 빌드
npm run build:cloudflare

# 2단계: Cloudflare Pages 로컬 서버 실행
npm run dev:cloudflare
# http://localhost:3001 에서 확인
```

**옵션 C: Cloudflare Pages 자동 재빌드 (파일 변경 감지)**
```bash
npm run dev:cloudflare-auto
# 파일 변경 시 자동으로 재빌드 및 재시작
```

**옵션 D: 프리뷰 환경 (D1 데이터베이스 포함)**
```bash
npm run preview
# http://localhost:3002 에서 확인
# Cloudflare D1 바인딩 포함
```

## ⚙️ 환경 변수 상세 설명

### 필수 환경 변수
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `NEXTAUTH_SECRET` | JWT 서명용 비밀키 | `openssl rand -base64 32`로 생성 |
| `NEXTAUTH_URL` | 애플리케이션 URL | 로컬: `http://localhost:3000`<br/>프로덕션: `https://your-domain.pages.dev` |
| `ADMIN_USERNAME` | 관리자 계정 사용자명 | `admin` |
| `ADMIN_PASSWORD` | 관리자 계정 비밀번호 | 강력한 비밀번호 설정 필요 |

### 선택 환경 변수 (AI 기능)
| 변수명 | 설명 | 용도 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API 키 | AI 분석 및 태깅 |
| `OPENAI_API_KEY` | OpenAI API 키 | GPT 기반 분석 |
| `PERPLEXITY_API_KEY` | Perplexity API 키 | 리서치 기능 |

## 🚀 Cloudflare Pages 프로덕션 배포

이 프로젝트는 Cloudflare Pages에 최적화되어 있으며, D1 데이터베이스와 KV namespace를 활용합니다.

### Cloudflare Pages 프로젝트 설정

#### 1. Cloudflare Dashboard에서 새 Pages 프로젝트 생성

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 로그인
2. **Workers & Pages** > **Create application** > **Pages** 선택
3. GitHub 리포지토리 연결
4. 빌드 설정:
   ```
   프레임워크 프리셋: Next.js
   빌드 명령어: npm run build:cloudflare
   빌드 출력 디렉터리: .vercel/output/static
   ```

#### 2. D1 데이터베이스 생성 및 바인딩

```bash
# D1 데이터베이스 생성
npx wrangler d1 create metaverse-standards-prod

# 마이그레이션 실행
npx wrangler d1 execute metaverse-standards-prod --file=./migrations/001_initial_schema.sql
# 추가 마이그레이션 파일이 있다면 순서대로 실행
```

**Cloudflare Dashboard에서 바인딩 설정:**
1. Pages 프로젝트 > **Settings** > **Functions** > **D1 database bindings**
2. **Add binding** 클릭
   - Variable name: `MSP`
   - D1 database: 생성한 데이터베이스 선택

#### 3. KV Namespace 생성 및 바인딩

```bash
# KV namespace 생성
npx wrangler kv:namespace create "STANDARD_SEARCH_CACHE"
```

**Cloudflare Dashboard에서 바인딩 설정:**
1. Pages 프로젝트 > **Settings** > **Functions** > **KV namespace bindings**
2. **Add binding** 클릭
   - Variable name: `STANDARD_SEARCH_CACHE`
   - KV namespace: 생성한 namespace 선택

#### 4. 환경 변수 설정

Pages 프로젝트 > **Settings** > **Environment variables**에서 다음 변수들을 설정:

**프로덕션 환경 변수:**
```ini
# 필수
NEXTAUTH_SECRET=프로덕션용_긴_랜덤_문자열
NEXTAUTH_URL=https://your-project.pages.dev
ADMIN_USERNAME=admin
ADMIN_PASSWORD=강력한_비밀번호

# AI 기능 (선택)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
PERPLEXITY_API_KEY=pplx-...
```

> 프로덕션과 프리뷰 환경에 대해 각각 다른 값을 설정할 수 있습니다.

#### 5. 배포

**자동 배포 (권장):**
- `main` 브랜치에 푸시하면 자동으로 프로덕션 배포
- 다른 브랜치에 푸시하면 프리뷰 배포 생성

**수동 배포:**
```bash
# 로컬에서 빌드
npm run build:cloudflare

# wrangler로 배포
npx wrangler pages deploy .vercel/output/static --project-name=your-project-name
```

### 배포 후 확인사항

1. **D1 데이터베이스 연결 확인**
   - 애플리케이션에서 데이터 조회가 정상 작동하는지 확인

2. **관리자 로그인 테스트**
   - `/admin` 경로로 이동
   - 설정한 ADMIN_USERNAME/ADMIN_PASSWORD로 로그인

3. **AI 기능 테스트** (API 키 설정 시)
   - 보고서 분석 및 태깅 기능 확인

### 커스텀 도메인 연결 (선택)

1. Pages 프로젝트 > **Custom domains** > **Set up a custom domain**
2. 도메인 입력 후 DNS 레코드 설정
3. SSL/TLS 인증서 자동 발급 대기 (보통 수 분 소요)

### 모니터링 및 로그

- **로그 확인**: Pages 프로젝트 > **Functions** > **Real-time Logs**
- **분석**: Pages 프로젝트 > **Analytics**
- **D1 쿼리 모니터링**: D1 데이터베이스 > **Metrics**

## 📄 주요 문서

- [PRD.md](PRD.md) – 제품 요구사항 문서
- [DB-SYNC.md](DB-SYNC.md) – DB 마이그레이션·동기화 가이드
- [CLAUDE.md](CLAUDE.md) – Task Master AI(CLI) 통합 가이드
- [TODO.md](TODO.md) – 진행 중/예정 작업 목록

## 📝 라이선스

별도 명시가 없는 한 본 프로젝트의 모든 권리는 보유자에게 있습니다.
