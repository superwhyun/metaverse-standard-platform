# 데이터베이스 동기화 가이드

원격 Cloudflare D1 데이터베이스의 데이터를 로컬 개발 환경으로 동기화하는 방법입니다.

## 사용 방법

### 방법 1: npm 스크립트 사용 (추천)

```bash
# 상세한 동기화 (진행 상황 표시)
npm run sync-db

# 간단한 동기화 (빠른 실행)
npm run sync-db:simple
```

### 방법 2: 스크립트 직접 실행

```bash
# 상세한 동기화
./sync-db.sh

# 간단한 동기화
./sync-db-simple.sh
```

### 방법 3: 수동 실행

```bash
# 1. 원격 DB 백업
wrangler d1 export metaverse-standards-dev --output remote-backup.sql --remote

# 2. INSERT 구문만 추출
grep "INSERT INTO" remote-backup.sql | grep -v "d1_migrations" > insert-only.sql

# 3. 로컬 DB 데이터 삭제
wrangler d1 execute metaverse-standards-dev --local --command="DELETE FROM users; DELETE FROM conferences; DELETE FROM reports; DELETE FROM organizations; DELETE FROM categories; DELETE FROM tech_analysis_reports;"

# 4. 데이터 복원
wrangler d1 execute metaverse-standards-dev --local --file insert-only.sql

# 5. 임시 파일 정리
rm insert-only.sql
```

## 동기화되는 테이블

- `users` - 사용자 계정 정보
- `conferences` - 회의 일정 데이터
- `reports` - 동향 보고서 데이터
- `organizations` - 표준화 기구 정보
- `categories` - 카테고리 분류 정보
- `tech_analysis_reports` - 기술 분석 보고서

## 주의사항

1. **기존 로컬 데이터가 삭제됩니다** - 동기화 과정에서 로컬 DB의 모든 데이터가 삭제되고 원격 데이터로 대체됩니다.

2. **인터넷 연결 필요** - 원격 Cloudflare D1 데이터베이스에 접근해야 하므로 인터넷 연결이 필요합니다.

3. **Wrangler 인증** - Cloudflare 계정으로 로그인되어 있어야 합니다.
   ```bash
   wrangler login
   ```

4. **권한 확인** - D1 데이터베이스에 대한 읽기 권한이 있어야 합니다.

## 트러블슈팅

### 권한 오류가 발생하는 경우
```bash
wrangler login
wrangler whoami  # 인증 상태 확인
```

### 테이블이 존재하지 않는 경우
마이그레이션을 먼저 실행하세요:
```bash
wrangler d1 migrations apply metaverse-standards-dev --local
```

### 스크립트 실행 권한 오류
```bash
chmod +x sync-db.sh
chmod +x sync-db-simple.sh
```

## 파일 설명

- `sync-db.sh` - 상세한 진행 상황과 검증을 포함한 동기화 스크립트
- `sync-db-simple.sh` - 최소한의 출력으로 빠르게 동기화하는 스크립트
- `remote-backup.sql` - 원격 DB에서 생성된 백업 파일 (참조용으로 보관됨)

## 개발 워크플로우

1. 원격에서 데이터가 업데이트되면 `npm run sync-db` 실행
2. 로컬 개발 서버 재시작: `npm run dev`
3. 최신 데이터로 개발 및 테스트 수행