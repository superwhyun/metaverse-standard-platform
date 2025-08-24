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

- 프레임워크: Next.js 13 (App Router)
- 언어: TypeScript, React
- 스타일: Tailwind CSS, shadcn UI
- 데이터베이스: Cloudflare D1 / Supabase (추상화 레이어)
- 인증: NextAuth.js / Edge functions
- 배포: Vercel, Cloudflare Workers 등

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

1. 리포지토리 클론 및 의존성 설치
   ```bash
   git clone <repo-url>
   cd <repo-dir>
   npm install
   ```
2. 환경 변수 설정
   ```bash
   cp .env.example .env
   # .env 파일에 DATABASE_URL, OPENAI_API_KEY 등 값 입력
   ```
3. 데이터베이스 마이그레이션
   ```bash
   # DB-SYNC.md 가이드 참고
   npm run migrate
   ```
4. 개발 서버 실행
   ```bash
   npm run dev
   ```

## ⚙️ 환경 변수

```ini
# .env 예시
DATABASE_URL=
NEXTAUTH_URL=
OPENAI_API_KEY=
...
```

## 📄 주요 문서

- [PRD.md](PRD.md) – 제품 요구사항 문서
- [DB-SYNC.md](DB-SYNC.md) – DB 마이그레이션·동기화 가이드
- [CLAUDE.md](CLAUDE.md) – Task Master AI(CLI) 통합 가이드
- [TODO.md](TODO.md) – 진행 중/예정 작업 목록

## 📝 라이선스

별도 명시가 없는 한 본 프로젝트의 모든 권리는 보유자에게 있습니다.
