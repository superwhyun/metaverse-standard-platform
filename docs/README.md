# 메타버스 국제표준화 플랫폼 API 문서

## 개요

메타버스 국제표준화 플랫폼의 REST API 문서입니다. 이 문서를 통해 제3자 프로그램에서 플랫폼의 데이터를 자동화된 방식으로 관리할 수 있습니다.

## 🚀 빠른 시작

### 1. 인증
모든 데이터 수정 작업(생성, 수정, 삭제)에는 관리자 권한이 필요합니다.

```bash
# 로그인 후 JWT 토큰 획득
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'
```

### 2. 보고서 일괄 등록 (주요 사용 사례)
```bash
# JWT 토큰을 사용하여 보고서 등록
curl -X POST https://your-domain.com/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @report-data.json
```

## 📚 API 참조

### 인증
- [로그인](./api-reference/auth/login.md) - JWT 토큰 획득
- [세션 확인](./api-reference/auth/session.md) - 현재 세션 상태 확인
- [로그아웃](./api-reference/auth/logout.md) - 세션 종료

### 보고서 관리 ⭐️
- [보고서 목록 조회](./api-reference/reports/list.md)
- [보고서 등록](./api-reference/reports/create.md) - **일괄 등록에 핵심**
- [개별 보고서 조회](./api-reference/reports/get.md)
- [보고서 수정](./api-reference/reports/update.md)
- [보고서 삭제](./api-reference/reports/delete.md)

### 회의 관리
- [회의 목록 조회](./api-reference/conferences/list.md)
- [회의 등록](./api-reference/conferences/create.md)
- [개별 회의 조회](./api-reference/conferences/get.md)
- [회의 수정](./api-reference/conferences/update.md)

### 메타데이터 관리
- [카테고리 관리](./api-reference/categories/)
- [기관 관리](./api-reference/organizations/)

### 기술 분석
- [기술 소식 관리](./api-reference/tech-analysis/)

## 🔧 실용적인 예시

### Node.js 일괄 등록 스크립트
```javascript
// 완전한 예시는 examples/bulk-import/node-example/ 참조
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const { user } = await response.json();
// JWT 토큰으로 보고서 등록...
```

### Python 일괄 등록 스크립트
```python
# 완전한 예시는 examples/bulk-import/python-example/ 참조
import requests
import pandas as pd

# CSV에서 데이터 로드 후 API로 일괄 등록
df = pd.read_csv('reports.csv')
for _, report in df.iterrows():
    # API 호출...
```

## 📋 데이터 스키마

모든 API 요청/응답의 정확한 스키마는 [schemas/](./schemas/) 폴더에서 확인할 수 있습니다.

## 🧪 테스트 도구

- [Postman Collection](./examples/postman/api-collection.json) - 모든 API 엔드포인트 테스트용

## ⚠️ 주의사항

- **Rate Limiting**: 과도한 요청을 방지하기 위해 적절한 지연시간을 두고 요청하세요
- **인증 토큰**: JWT 토큰은 7일간 유효합니다
- **데이터 유효성**: 필수 필드를 반드시 확인하고, 날짜는 YYYY-MM-DD 형식을 사용하세요
- **에러 처리**: 네트워크 오류나 서버 오류에 대한 재시도 로직을 구현하세요

## 🤝 지원

API 사용 중 문제가 발생하면 관리자에게 문의하세요.

---

**최종 업데이트**: 2024년 8월