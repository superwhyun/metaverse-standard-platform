# 보고서 일괄 등록 예시

이 폴더에는 메타버스 국제표준화 플랫폼에 보고서를 일괄 등록하는 실제 동작하는 예시 코드들이 있습니다.

## 📁 폴더 구조

```
bulk-import/
├── README.md                 # 이 파일
├── node-example/             # Node.js 예시
│   ├── package.json
│   ├── bulk-import.js        # 메인 스크립트
│   ├── sample-data.csv       # 샘플 CSV 데이터
│   └── README.md             # Node.js 사용법
└── python-example/           # Python 예시
    ├── requirements.txt
    ├── bulk_import.py         # 메인 스크립트
    ├── sample_data.csv        # 샘플 CSV 데이터
    └── README.md             # Python 사용법
```

## 🚀 빠른 시작

### 1. 환경 선택

**Node.js를 선호하는 경우:**
```bash
cd node-example
npm install
node bulk-import.js
```

**Python을 선호하는 경우:**
```bash
cd python-example
pip install -r requirements.txt
python bulk_import.py
```

### 2. 설정 파일 준비

각 예시 폴더에서 다음 정보를 설정하세요:

- **API URL**: 플랫폼의 기본 URL
- **관리자 계정**: 로그인 정보
- **CSV 파일**: 등록할 보고서 데이터

## 📋 CSV 데이터 형식

```csv
title,date,summary,content,category,organization,tags,downloadUrl,conferenceId
"ITU-T SG16 메타버스 표준화 현황","2024-08-24","ITU-T SG16의 메타버스 관련 표준화 현황","## 개요...","표준","ITU","메타버스,ITU-T,표준화","https://example.com/report1.pdf",
"ISO 메타버스 표준 동향","2024-08-23","ISO의 메타버스 표준화 작업 현황","## ISO JTC1...","표준","ISO","메타버스,ISO,표준화","https://example.com/report2.pdf",123
```

### 필수 필드
- `title`: 보고서 제목
- `date`: 날짜 (YYYY-MM-DD 형식)
- `summary`: 요약 내용
- `content`: 본문 내용 (마크다운 지원)
- `category`: 카테고리
- `organization`: 작성 기관

### 선택 필드
- `tags`: 쉼표로 구분된 태그들
- `downloadUrl`: 다운로드 링크
- `conferenceId`: 연관된 회의 ID

## ⚠️ 주의사항

1. **인증**: 관리자 계정으로 로그인해야 합니다
2. **Rate Limiting**: 요청 간격을 적절히 조절하세요
3. **데이터 검증**: CSV 데이터의 형식을 확인하세요
4. **백업**: 대량 등록 전에 기존 데이터를 백업하세요

## 🔧 고급 사용법

### 배치 처리
대량의 데이터를 처리할 때는 배치 단위로 나누어 처리하세요:

```javascript
// 예시: 한 번에 5개씩 처리
const batchSize = 5;
for (let i = 0; i < reports.length; i += batchSize) {
  const batch = reports.slice(i, i + batchSize);
  await processBatch(batch);
  await sleep(1000); // 1초 대기
}
```

### 에러 복구
실패한 항목들을 별도로 처리할 수 있도록 로깅하세요:

```javascript
const failedReports = results.filter(r => !r.success);
console.log(`Failed reports: ${failedReports.length}`);
failedReports.forEach(r => console.log(`- ${r.title}: ${r.error}`));
```

### 진행상황 모니터링
대량 데이터 처리 시 진행상황을 모니터링하세요:

```javascript
console.log(`Processing ${i + 1}/${total}: ${report.title}`);
const progress = Math.round(((i + 1) / total) * 100);
console.log(`Progress: ${progress}%`);
```

## 📊 성능 가이드라인

| 데이터 크기 | 권장 배치 크기 | 예상 처리 시간 |
|-------------|----------------|----------------|
| 10-50개     | 1-2개          | 1-5분          |
| 50-200개    | 3-5개          | 5-20분         |
| 200-1000개  | 5-10개         | 20-100분       |

## 🆘 문제 해결

### 일반적인 오류

1. **"관리자 권한이 필요합니다"**
   - 로그인 정보 확인
   - JWT 토큰 만료 여부 확인

2. **"title is required"**
   - CSV 필드 확인
   - 빈 값 검증

3. **"Invalid date format"**
   - 날짜 형식을 YYYY-MM-DD로 변경

4. **네트워크 타임아웃**
   - 요청 간격 늘리기
   - 배치 크기 줄이기

### 로그 확인
각 스크립트는 상세한 로그를 생성합니다:
- 성공/실패 현황
- 에러 메시지
- 처리 통계

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. [API 문서](../../api-reference/reports/create.md)
2. [인증 가이드](../../authentication.md)
3. 각 예시 폴더의 README.md

그래도 해결되지 않으면 관리자에게 문의하세요.