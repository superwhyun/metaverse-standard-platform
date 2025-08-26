# 보고서 등록 API

## 개요

새로운 보고서를 등록합니다. **일괄 등록의 핵심 API**로, 제3자 프로그램에서 대량의 보고서 데이터를 자동으로 등록할 때 사용됩니다.

## 기본 정보

- **HTTP 메서드**: `POST`
- **엔드포인트**: `/api/reports`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
POST /api/reports
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### 요청 바디

```json
{
  "title": "보고서 제목",
  "date": "2024-08-24",
  "summary": "보고서 요약 내용",
  "content": "보고서 전체 내용 (마크다운 지원)",
  "category": "카테고리명",
  "organization": "기관명",
  "tags": ["태그1", "태그2", "태그3"],
  "downloadUrl": "https://example.com/report.pdf",
  "conferenceId": 123
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `title` | string | ✅ | 보고서 제목 | "ITU-T SG16 메타버스 표준화 현황" |
| `date` | string | ✅ | 보고서 날짜 (YYYY-MM-DD) | "2024-08-24" |
| `summary` | string | ✅ | 보고서 요약 | "메타버스 관련 ITU 표준화 동향..." |
| `content` | string | ✅ | 보고서 전문 (마크다운 지원) | "## 개요\n메타버스는..." |
| `category` | string | ✅ | 카테고리 | "표준", "정책", "기술동향" 등 |
| `organization` | string | ✅ | 작성 기관 | "ITU", "ISO", "IEEE" 등 |
| `tags` | array | ❌ | 태그 배열 | ["메타버스", "XR", "표준화"] |
| `downloadUrl` | string | ❌ | 다운로드 링크 | "https://..." |
| `conferenceId` | number | ❌ | 연관된 회의 ID | 123 |

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true,
  "data": {
    "id": 456,
    "title": "보고서 제목",
    "date": "2024-08-24",
    "summary": "보고서 요약 내용",
    "content": "보고서 전체 내용",
    "category": "카테고리명",
    "organization": "기관명",
    "tags": ["태그1", "태그2"],
    "downloadUrl": "https://example.com/report.pdf",
    "conferenceId": 123,
    "createdAt": "2024-08-24T10:30:00.000Z",
    "updatedAt": "2024-08-24T10:30:00.000Z"
  }
}
```

### 에러 응답

#### 인증 오류 (401)
```json
{
  "success": false,
  "error": "관리자 권한이 필요합니다."
}
```

#### 필수 필드 누락 (400)
```json
{
  "success": false,
  "error": "title is required"
}
```

#### 서버 오류 (500)
```json
{
  "success": false,
  "error": "Failed to create report"
}
```

## 실용적인 사용 예시

### 1. 단일 보고서 등록

```bash
curl -X POST https://your-domain.com/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "ITU-T SG16 Q4 메타버스 표준화 현황",
    "date": "2024-08-24",
    "summary": "ITU-T Study Group 16에서 진행 중인 메타버스 관련 표준화 작업의 현황을 정리한 보고서입니다.",
    "content": "## 개요\n\nITU-T Study Group 16은 멀티미디어 서비스, 시스템 및 애플리케이션에 대한 표준화를 담당하는 연구반입니다.\n\n## 메타버스 관련 표준화 현황\n\n### 1. F.748.1 - Requirements for immersive services\n- 상태: 승인됨 (2023년)\n- 내용: 몰입형 서비스에 대한 요구사항\n\n### 2. F.748.2 - Framework for immersive services\n- 상태: 개발 중\n- 내용: 몰입형 서비스 프레임워크\n\n## 결론\n\nITU-T SG16에서는 메타버스 관련 표준화가 활발히 진행되고 있으며...",
    "category": "표준",
    "organization": "ITU",
    "tags": ["메타버스", "ITU-T", "SG16", "표준화", "몰입형서비스"],
    "downloadUrl": "https://example.com/reports/itu-sg16-metaverse-2024.pdf"
  }'
```

### 2. Node.js 일괄 등록 예시

```javascript
const fs = require('fs');
const fetch = require('node-fetch');

class BulkReportImporter {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
  }

  async importReports(reports) {
    const results = [];
    
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      console.log(`Processing ${i + 1}/${reports.length}: ${report.title}`);
      
      try {
        const response = await fetch(`${this.apiUrl}/api/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify(report)
        });

        if (response.ok) {
          const result = await response.json();
          results.push({ success: true, id: result.data.id, title: report.title });
          console.log(`✅ Success: ${report.title} (ID: ${result.data.id})`);
        } else {
          const error = await response.text();
          results.push({ success: false, title: report.title, error });
          console.log(`❌ Failed: ${report.title} - ${error}`);
        }
        
        // 서버 부하 방지를 위한 지연
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({ success: false, title: report.title, error: error.message });
        console.log(`❌ Error: ${report.title} - ${error.message}`);
      }
    }
    
    return results;
  }
}

// 사용 예시
async function main() {
  const reports = [
    {
      title: "ITU-T SG16 메타버스 표준화 현황",
      date: "2024-08-24",
      summary: "ITU-T SG16의 메타버스 관련 표준화 현황",
      content: "## 개요\n...",
      category: "표준",
      organization: "ITU",
      tags: ["메타버스", "ITU-T", "표준화"]
    },
    {
      title: "ISO/IEC JTC1 SC24 메타버스 표준",
      date: "2024-08-23",
      summary: "ISO/IEC의 메타버스 관련 표준화 작업",
      content: "## ISO/IEC JTC1 SC24\n...",
      category: "표준",
      organization: "ISO",
      tags: ["메타버스", "ISO", "JTC1"]
    }
    // ... 더 많은 보고서
  ];

  const importer = new BulkReportImporter('https://your-domain.com', 'YOUR_JWT_TOKEN');
  const results = await importer.importReports(reports);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Import Summary:`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  // 실패한 항목들 출력
  if (failed > 0) {
    console.log('\n❌ Failed Reports:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.title}: ${r.error}`);
    });
  }
}

main();
```

### 3. CSV에서 일괄 등록 (Node.js)

```javascript
const csv = require('csv-parser');
const fs = require('fs');

async function importFromCSV(csvFilePath, token) {
  const reports = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // CSV 컬럼을 API 형식으로 변환
        const report = {
          title: row.title,
          date: row.date,
          summary: row.summary,
          content: row.content,
          category: row.category,
          organization: row.organization,
          tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
          downloadUrl: row.downloadUrl || undefined,
          conferenceId: row.conferenceId ? parseInt(row.conferenceId) : undefined
        };
        reports.push(report);
      })
      .on('end', async () => {
        console.log(`CSV loaded: ${reports.length} reports found`);
        
        const importer = new BulkReportImporter('https://your-domain.com', token);
        const results = await importer.importReports(reports);
        resolve(results);
      })
      .on('error', reject);
  });
}

// CSV 파일 형식 예시 (reports.csv)
/*
title,date,summary,content,category,organization,tags,downloadUrl,conferenceId
"ITU-T SG16 메타버스 표준화 현황","2024-08-24","ITU-T SG16의 메타버스 관련 표준화 현황","## 개요...","표준","ITU","메타버스,ITU-T,표준화","https://example.com/report1.pdf",
"ISO 메타버스 표준 동향","2024-08-23","ISO의 메타버스 표준화 작업 현황","## ISO JTC1...","표준","ISO","메타버스,ISO,표준화","https://example.com/report2.pdf",123
*/
```

## 데이터 유효성 검증

### 날짜 형식
- **필수 형식**: `YYYY-MM-DD`
- **올바른 예시**: `"2024-08-24"`
- **잘못된 예시**: `"24/08/2024"`, `"2024.8.24"`, `"Aug 24, 2024"`

### 태그 배열
- **형식**: 문자열 배열 `["tag1", "tag2"]`
- **빈 배열 허용**: `[]`
- **null/undefined 허용**: 필드 생략 가능

### 카테고리 및 기관명
- 시스템에 존재하지 않는 카테고리나 기관명도 자동으로 생성됨
- 정확한 명칭 사용 권장

## 성능 최적화 팁

### 1. 배치 크기 조절
```javascript
// 한 번에 너무 많은 요청을 보내지 않도록 배치 처리
async function processBatches(reports, batchSize = 5) {
  for (let i = 0; i < reports.length; i += batchSize) {
    const batch = reports.slice(i, i + batchSize);
    await Promise.all(batch.map(report => createReport(report)));
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
  }
}
```

### 2. 재시도 로직
```javascript
async function createReportWithRetry(report, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createReport(report);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

## 일반적인 에러 및 해결책

| 에러 메시지 | 원인 | 해결책 |
|------------|------|--------|
| "title is required" | 필수 필드 누락 | title 필드 확인 |
| "Invalid date format" | 날짜 형식 오류 | YYYY-MM-DD 형식 사용 |
| "관리자 권한이 필요합니다" | 인증 실패 | JWT 토큰 확인 |
| "Failed to create report" | 서버 오류 | 잠시 후 재시도 |

이 API를 사용하면 제3자 프로그램에서 메타버스 표준화 플랫폼에 대량의 보고서를 효율적으로 등록할 수 있습니다.