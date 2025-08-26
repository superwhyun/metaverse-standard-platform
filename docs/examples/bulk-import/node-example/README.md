# Node.js 보고서 일괄 등록 도구

메타버스 국제표준화 플랫폼에 보고서를 일괄 등록하는 Node.js 기반 도구입니다.

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 기본 사용법

```bash
# 샘플 데이터로 테스트 실행 (실제 등록 안함)
npm run test

# 실제 등록 실행
node bulk-import.js --password YOUR_ADMIN_PASSWORD
```

## 📋 명령어 옵션

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `--api-url <url>` | `http://localhost:3001` | API 서버 URL |
| `--username <username>` | `admin` | 관리자 사용자명 |
| `--password <password>` | *필수* | 관리자 비밀번호 |
| `--csv-file <file>` | `sample-data.csv` | CSV 파일 경로 |
| `--batch-size <number>` | `3` | 동시 처리할 항목 수 |
| `--delay <ms>` | `500` | 요청 간 지연시간 (밀리초) |
| `--dry-run` | `false` | 테스트 모드 (실제 등록 안함) |
| `--help` | - | 도움말 표시 |

## 💾 CSV 데이터 형식

### 필수 컬럼
- `title`: 보고서 제목
- `date`: 날짜 (YYYY-MM-DD 형식)  
- `summary`: 요약 내용
- `content`: 본문 내용 (마크다운 지원)
- `category`: 카테고리
- `organization`: 작성 기관

### 선택 컬럼  
- `tags`: 쉼표로 구분된 태그들
- `downloadUrl`: 다운로드 링크
- `conferenceId`: 연관된 회의 ID

### 예시 CSV

```csv
title,date,summary,content,category,organization,tags,downloadUrl,conferenceId
"ITU-T 메타버스 표준화 현황","2024-08-24","ITU-T SG16의 메타버스 관련 표준화 현황","## 개요...","표준","ITU","메타버스,ITU-T,표준화","https://example.com/report1.pdf",
```

## 🔧 고급 사용법

### 1. 대량 데이터 처리

```bash
# 배치 크기를 줄여서 서버 부하 감소
node bulk-import.js --batch-size 2 --delay 1000 --password YOUR_PASSWORD

# 특정 CSV 파일 사용
node bulk-import.js --csv-file my-reports.csv --password YOUR_PASSWORD
```

### 2. 다른 서버 연결

```bash
# 운영 서버에 등록
node bulk-import.js \
  --api-url https://metaverse-standards.com \
  --password YOUR_PASSWORD \
  --csv-file production-reports.csv
```

### 3. 테스트 실행

```bash
# 실제 등록하지 않고 검증만
node bulk-import.js --dry-run --password dummy
```

## 📊 출력 정보

도구 실행 시 다음 정보들이 표시됩니다:

### 진행 과정
- 🔐 **로그인 상태**: 관리자 인증 성공/실패
- 📄 **CSV 로딩**: 파일에서 읽어온 보고서 수
- 🔍 **데이터 검증**: 필수 필드, 날짜 형식 등 검사
- 📈 **진행률 바**: 실시간 등록 진행 상황

### 최종 결과
- ✅ **성공 건수**: 정상 등록된 보고서 수
- ❌ **실패 건수**: 등록에 실패한 보고서 수  
- 📋 **상세 목록**: 성공/실패한 각 보고서의 상세 정보
- 💾 **결과 파일**: `import-results-YYYY-MM-DD.csv` 형태로 자동 저장

## ⚠️ 주의사항

### 데이터 준비
1. **CSV 인코딩**: UTF-8 형식으로 저장하세요
2. **날짜 형식**: 반드시 YYYY-MM-DD 형식을 사용하세요
3. **쉼표 처리**: 제목이나 내용에 쉼표가 있으면 따옴표로 감싸세요
4. **개행 문자**: 내용에 개행이 필요하면 `\\n`을 사용하세요

### 성능 최적화
1. **배치 크기**: 서버 성능에 따라 1-5 사이로 조절하세요
2. **지연 시간**: 서버 부하를 고려하여 300-1000ms 사이로 설정하세요
3. **네트워크**: 안정적인 네트워크 환경에서 실행하세요

### 에러 처리
1. **재시도**: 네트워크 오류 시 자동 재시도됩니다
2. **로그 확인**: 실패한 항목은 콘솔과 결과 CSV에 기록됩니다
3. **부분 성공**: 일부 실패해도 성공한 항목은 정상 등록됩니다

## 🛠️ 문제 해결

### 일반적인 오류들

#### 1. "로그인 실패"
```
❌ 로그인 오류: 로그인 실패 (401): {"success":false,"error":"Invalid credentials"}
```
**해결책**: `--username`과 `--password` 옵션을 확인하세요.

#### 2. "API 연결 실패"  
```
❌ API 연결 실패: fetch failed
```
**해결책**: `--api-url` 옵션이 올바른지, 서버가 실행 중인지 확인하세요.

#### 3. "CSV 파일을 찾을 수 없음"
```
❌ CSV 파일을 찾을 수 없습니다: sample-data.csv
```
**해결책**: CSV 파일 경로를 확인하거나 `--csv-file` 옵션을 사용하세요.

#### 4. "날짜 형식 오류"
```
❌ 행 3: 잘못된 날짜 형식 "2024/08/24" (YYYY-MM-DD 필요)
```
**해결책**: 날짜를 `2024-08-24` 형식으로 변경하세요.

#### 5. "필수 필드 누락"
```
⚠️ 행 건너뜀 (필수 필드 누락): 제목 없음
```
**해결책**: CSV의 필수 컬럼들이 모두 채워져 있는지 확인하세요.

### 디버깅 팁

#### 1. 상세 로그 확인
도구는 각 단계별로 상세한 로그를 출력합니다:
```
🔐 관리자 로그인 중...
✅ 로그인 성공: 관리자
📄 CSV 파일 로드 중: sample-data.csv
✅ CSV 로드 완료: 5개 보고서
🔍 데이터 유효성 검사 중...
✅ 데이터 유효성 검사 통과
🚀 보고서 등록 시작
```

#### 2. 결과 파일 분석
실행 후 생성되는 `import-results-*.csv` 파일에서:
- `success` 컬럼: true/false 로 성공 여부 확인
- `error` 컬럼: 실패한 경우 구체적인 오류 메시지 확인

#### 3. 단계별 테스트
문제가 발생하면 단계별로 테스트해보세요:
```bash
# 1. 연결 테스트만
curl https://your-domain.com/api/reports

# 2. 로그인 테스트만  
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# 3. 드라이런으로 검증만
node bulk-import.js --dry-run
```

## 🔧 커스터마이징

### 1. 다른 프로그래밍 언어로 포팅
이 도구의 로직을 다른 언어로 구현할 수 있습니다:

**Python 버전**: `../python-example/` 폴더 참조

**핵심 단계**:
1. JWT 토큰으로 로그인
2. CSV 파일 파싱
3. 데이터 유효성 검사
4. 배치 단위로 API 호출
5. 결과 로깅 및 저장

### 2. 코드 수정
`bulk-import.js` 파일을 직접 수정하여:
- 다른 API 엔드포인트 지원
- 추가적인 데이터 변환 로직
- 커스텀 에러 처리
- 다른 파일 형식 지원 (JSON, Excel 등)

## 📞 지원

문제가 발생하면:

1. **문서 확인**: [API 문서](../../../api-reference/reports/create.md)
2. **예시 확인**: `sample-data.csv` 파일 참조
3. **로그 분석**: 콘솔 출력 및 결과 CSV 파일 확인
4. **관리자 문의**: API 서버 관리자에게 연락

---

**💡 팁**: 처음 사용할 때는 `--dry-run` 옵션으로 테스트한 후 실제 등록을 진행하세요!