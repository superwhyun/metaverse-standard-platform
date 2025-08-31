# MD 파일을 보고서로 등록하는 도구

메타버스 국제표준화 플랫폼에 마크다운 파일을 보고서로 등록할 수 있는 Node.js 도구입니다.

## 설치

utils 디렉토리로 이동한 후 필요한 의존성을 설치합니다:

```bash
cd utils
npm install
```

## MD 파일 포맷

마크다운 파일은 YAML frontmatter를 포함해야 합니다:

```yaml
---
title: "보고서 제목"
date: "2024-01-15"  # YYYY-MM-DD 형식
summary: "보고서 요약"
category: "카테고리명"
organization: "표준화 기구명"
tags: ["태그1", "태그2", "태그3"]  # 배열 형태
downloadUrl: "https://example.com/file.pdf"  # 선택사항
conferenceId: 123  # 선택사항
---

# 마크다운 본문 내용

여기에 보고서의 실제 내용을 마크다운 형식으로 작성합니다.
```

### 필수 필드
- `title`: 보고서 제목 (최대 200자)
- `date`: 날짜 (YYYY-MM-DD 형식)
- `summary`: 보고서 요약 (최대 500자)
- `category`: 카테고리명
- `organization`: 표준화 기구명

### 선택 필드
- `tags`: 태그 배열
- `downloadUrl`: 다운로드 URL (http/https로 시작)
- `conferenceId`: 연관된 컨퍼런스 ID (숫자)

## 사용법

### 단일 파일 등록

```bash
node md-to-report.js --file example-report.md --password your_admin_password
```

### 디렉토리 배치 등록

```bash
node md-to-report.js --dir ../reports --password your_admin_password
```

### 전체 옵션

```bash
node md-to-report.js [options]

옵션:
  --file <file>            MD 파일 경로
  --dir <directory>        MD 파일들이 있는 디렉토리
  --api-url <url>          API 기본 URL (기본값: http://localhost:3001)
  --username <username>    관리자 사용자명 (기본값: admin)
  --password <password>    관리자 비밀번호 (필수)
  --dry-run                실제 등록하지 않고 테스트만 실행
  --help                   도움말 표시
```

### 예제

1. **테스트 실행** (실제 등록하지 않음):
   ```bash
   node md-to-report.js --file example-report.md --password admin123 --dry-run
   ```

2. **로컬 서버에 단일 파일 등록**:
   ```bash
   node md-to-report.js --file example-report.md --password admin123
   ```

3. **프로덕션 서버에 디렉토리 배치 등록**:
   ```bash
   node md-to-report.js --dir ../reports --api-url https://metaverse-platform.com --password admin123
   ```

## 출력 예제

```
📝 메타버스 플랫폼 MD 파일 보고서 등록 도구
==================================================
🔍 API 연결 테스트: http://localhost:3001
✅ API 연결 성공
📄 마크다운 파일 로드 중...
✅ 1개 보고서 로드 완료
🔍 데이터 유효성 검사 중...
✅ 데이터 유효성 검사 통과
🔐 관리자 로그인 중...
✅ 로그인 성공: Admin User

⚠️  1개의 보고서를 등록하시겠습니까?
계속하려면 Enter를 누르세요... (Ctrl+C로 취소)

🚀 보고서 등록 시작
진행률 ███████████████████████████████████████ 100% | 1/1 | 성공: 1 | 실패: 0

📊 등록 결과 요약
================
✅ 성공: 1개
❌ 실패: 0개
📄 전체: 1개

✅ 성공한 보고서들:
  1. 메타버스 플랫폼 상호운용성 표준 현황 (ID: 123)
     파일: utils/example-report.md
```

## 주의사항

1. **인증**: 관리자 권한이 있는 계정의 비밀번호가 필요합니다.
2. **API 연결**: 플랫폼 서버가 실행 중이어야 합니다.
3. **파일 형식**: `.md` 확장자의 마크다운 파일만 지원합니다.
4. **YAML 문법**: frontmatter는 올바른 YAML 문법을 따라야 합니다.
5. **중복 등록**: 동일한 제목의 보고서가 이미 있어도 새로 등록됩니다.

## 오류 해결

### 일반적인 오류

1. **로그인 실패**: 사용자명/비밀번호 확인
2. **API 연결 실패**: 서버 URL과 상태 확인
3. **파일 형식 오류**: YAML frontmatter 문법 확인
4. **필드 누락**: 필수 필드가 모두 포함되어 있는지 확인

### 디버깅

`--dry-run` 옵션을 사용하여 실제 등록 없이 테스트할 수 있습니다:

```bash
node md-to-report.js --file example-report.md --password admin123 --dry-run
```