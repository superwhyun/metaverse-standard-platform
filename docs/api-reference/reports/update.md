# 보고서 수정 API

## 개요

기존 보고서의 정보를 수정합니다. 모든 필드를 업데이트할 수 있으며, 일괄 수정 도구에서도 활용할 수 있습니다.

## 기본 정보

- **HTTP 메서드**: `PUT`
- **엔드포인트**: `/api/reports/{id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
PUT /api/reports/{id}
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 수정할 보고서 ID | `456` |

### 요청 바디

```json
{
  "title": "수정된 보고서 제목",
  "date": "2024-08-25",
  "summary": "수정된 보고서 요약 내용",
  "content": "수정된 보고서 전체 내용 (마크다운 지원)",
  "category": "수정된 카테고리",
  "organization": "수정된 기관명",
  "tags": ["수정된태그1", "수정된태그2"],
  "downloadUrl": "https://example.com/updated-report.pdf",
  "conferenceId": 124
}
```

### 필드 설명

모든 필드는 [보고서 등록 API](./create.md)와 동일한 형식을 따릅니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | string | ✅ | 수정할 보고서 제목 |
| `date` | string | ✅ | 수정할 날짜 (YYYY-MM-DD) |
| `summary` | string | ✅ | 수정할 요약 |
| `content` | string | ✅ | 수정할 본문 내용 |
| `category` | string | ✅ | 수정할 카테고리 |
| `organization` | string | ✅ | 수정할 기관명 |
| `tags` | array | ❌ | 수정할 태그 배열 |
| `downloadUrl` | string | ❌ | 수정할 다운로드 URL |
| `conferenceId` | number | ❌ | 수정할 연관 회의 ID |

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true,
  "data": {
    "id": 456,
    "title": "수정된 보고서 제목",
    "date": "2024-08-25",
    "summary": "수정된 보고서 요약 내용",
    "content": "수정된 보고서 전체 내용",
    "category": "수정된 카테고리",
    "organization": "수정된 기관명",
    "tags": ["수정된태그1", "수정된태그2"],
    "downloadUrl": "https://example.com/updated-report.pdf",
    "conferenceId": 124,
    "createdAt": "2024-08-24T10:30:00.000Z",
    "updatedAt": "2024-08-25T14:20:00.000Z"
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

#### 잘못된 ID (400)
```json
{
  "success": false,
  "error": "Invalid report ID"
}
```

#### 보고서 없음 (404)
```json
{
  "success": false,
  "error": "Report not found"
}
```

#### 서버 오류 (500)
```json
{
  "success": false,
  "error": "Failed to update report"
}
```

## 실용적인 사용 예시

### 1. 단일 보고서 수정

```bash
curl -X PUT https://your-domain.com/api/reports/456 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "ITU-T SG16 메타버스 표준화 현황 (업데이트됨)",
    "date": "2024-08-25",
    "summary": "ITU-T Study Group 16에서 진행 중인 메타버스 관련 표준화 작업의 최신 현황을 정리한 보고서입니다.",
    "content": "## 개요\n\n최신 업데이트된 내용입니다...",
    "category": "표준",
    "organization": "ITU",
    "tags": ["메타버스", "ITU-T", "SG16", "표준화", "업데이트"],
    "downloadUrl": "https://example.com/reports/itu-sg16-metaverse-2024-updated.pdf"
  }'
```

### 2. JavaScript로 보고서 수정

```javascript
async function updateReport(apiUrl, token, reportId, updateData) {
  try {
    const response = await fetch(`${apiUrl}/api/reports/${reportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('보고서를 찾을 수 없습니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('보고서 수정 실패:', error);
    throw error;
  }
}

// 사용 예시
const updatedReport = await updateReport(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  456,
  {
    title: '수정된 제목',
    summary: '수정된 요약',
    tags: ['새태그1', '새태그2']
  }
);

console.log('수정 완료:', updatedReport.title);
```

### 3. 일괄 보고서 수정

```javascript
async function bulkUpdateReports(apiUrl, token, updates) {
  const results = [];
  
  for (const update of updates) {
    try {
      console.log(`수정 중: ID ${update.id} - ${update.data.title}`);
      
      const response = await fetch(`${apiUrl}/api/reports/${update.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(update.data)
      });

      if (response.ok) {
        const result = await response.json();
        results.push({
          success: true,
          id: update.id,
          title: result.data.title,
          updatedAt: result.data.updatedAt
        });
        console.log(`✅ 수정 성공: ${result.data.title}`);
      } else {
        const error = await response.text();
        results.push({
          success: false,
          id: update.id,
          error
        });
        console.log(`❌ 수정 실패: ID ${update.id} - ${error}`);
      }
      
      // 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      results.push({
        success: false,
        id: update.id,
        error: error.message
      });
      console.log(`❌ 네트워크 오류: ID ${update.id} - ${error.message}`);
    }
  }
  
  return results;
}

// 사용 예시
const updates = [
  {
    id: 456,
    data: {
      title: '수정된 ITU 보고서',
      tags: ['메타버스', '업데이트됨']
    }
  },
  {
    id: 457,
    data: {
      summary: '수정된 요약 내용',
      category: '새카테고리'
    }
  }
];

const results = await bulkUpdateReports('https://your-domain.com', 'YOUR_JWT_TOKEN', updates);
console.log(`수정 완료: 성공 ${results.filter(r => r.success).length}개, 실패 ${results.filter(r => !r.success).length}개`);
```

### 4. 부분 업데이트 (특정 필드만 수정)

```javascript
async function partialUpdateReport(apiUrl, token, reportId, partialData) {
  // 먼저 기존 데이터를 가져옴
  const existingReport = await fetch(`${apiUrl}/api/reports/${reportId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json()).then(d => d.data);
  
  // 기존 데이터와 새 데이터를 병합
  const updateData = {
    title: partialData.title || existingReport.title,
    date: partialData.date || existingReport.date,
    summary: partialData.summary || existingReport.summary,
    content: partialData.content || existingReport.content,
    category: partialData.category || existingReport.category,
    organization: partialData.organization || existingReport.organization,
    tags: partialData.tags || existingReport.tags,
    downloadUrl: partialData.downloadUrl !== undefined ? partialData.downloadUrl : existingReport.downloadUrl,
    conferenceId: partialData.conferenceId !== undefined ? partialData.conferenceId : existingReport.conferenceId
  };
  
  return await updateReport(apiUrl, token, reportId, updateData);
}

// 태그만 업데이트
const updated = await partialUpdateReport(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  456,
  { tags: ['새태그1', '새태그2', '새태그3'] }
);
```

### 5. CSV를 통한 일괄 수정

```javascript
const csv = require('csv-parser');
const fs = require('fs');

async function updateReportsFromCSV(csvFilePath, apiUrl, token) {
  const updates = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (!row.id) {
          console.warn('ID가 없는 행 건너뜀:', row);
          return;
        }
        
        const updateData = {};
        
        // CSV에서 값이 있는 필드만 업데이트 데이터에 포함
        if (row.title) updateData.title = row.title.trim();
        if (row.date) updateData.date = row.date.trim();
        if (row.summary) updateData.summary = row.summary.trim();
        if (row.content) updateData.content = row.content.trim();
        if (row.category) updateData.category = row.category.trim();
        if (row.organization) updateData.organization = row.organization.trim();
        if (row.tags) updateData.tags = row.tags.split(',').map(tag => tag.trim());
        if (row.downloadUrl) updateData.downloadUrl = row.downloadUrl.trim();
        if (row.conferenceId) updateData.conferenceId = parseInt(row.conferenceId);
        
        updates.push({
          id: parseInt(row.id),
          data: updateData
        });
      })
      .on('end', async () => {
        console.log(`CSV에서 ${updates.length}개 수정 작업 로드됨`);
        const results = await bulkUpdateReports(apiUrl, token, updates);
        resolve(results);
      })
      .on('error', reject);
  });
}

// CSV 파일 형식 예시 (updates.csv)
/*
id,title,summary,tags
456,"수정된 ITU 보고서","수정된 요약 내용","메타버스,업데이트,ITU"
457,,"새로운 요약 내용",
458,,,"새태그1,새태그2"
*/
```

### 6. 수정 이력 추적

```javascript
class ReportUpdater {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.updateHistory = [];
  }

  async updateWithHistory(reportId, updateData) {
    // 수정 전 데이터 백업
    const beforeUpdate = await this.getReport(reportId);
    
    try {
      // 수정 실행
      const afterUpdate = await updateReport(this.apiUrl, this.token, reportId, updateData);
      
      // 이력 저장
      this.updateHistory.push({
        reportId,
        timestamp: new Date().toISOString(),
        before: beforeUpdate,
        after: afterUpdate,
        changes: this.detectChanges(beforeUpdate, afterUpdate)
      });
      
      return afterUpdate;
    } catch (error) {
      console.error(`수정 실패 (ID: ${reportId}):`, error);
      throw error;
    }
  }

  async getReport(reportId) {
    const response = await fetch(`${this.apiUrl}/api/reports/${reportId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json().then(d => d.data);
  }

  detectChanges(before, after) {
    const changes = [];
    const fields = ['title', 'date', 'summary', 'category', 'organization', 'tags'];
    
    fields.forEach(field => {
      const beforeValue = JSON.stringify(before[field]);
      const afterValue = JSON.stringify(after[field]);
      
      if (beforeValue !== afterValue) {
        changes.push({
          field,
          before: before[field],
          after: after[field]
        });
      }
    });
    
    return changes;
  }

  getUpdateHistory(reportId = null) {
    if (reportId) {
      return this.updateHistory.filter(h => h.reportId === reportId);
    }
    return this.updateHistory;
  }

  exportHistory(filename = 'update-history.json') {
    fs.writeFileSync(filename, JSON.stringify(this.updateHistory, null, 2));
    console.log(`수정 이력을 ${filename}에 저장했습니다.`);
  }
}

// 사용 예시
const updater = new ReportUpdater('https://your-domain.com', 'YOUR_JWT_TOKEN');

// 이력 추적하며 수정
await updater.updateWithHistory(456, {
  title: '이력이 추적되는 수정된 제목',
  tags: ['히스토리', '추적']
});

// 특정 보고서의 수정 이력 조회
const history = updater.getUpdateHistory(456);
console.log('수정 이력:', history);

// 전체 이력 파일로 저장
updater.exportHistory();
```

## 주의사항

### 데이터 무결성
- 모든 필수 필드는 빈 값으로 설정할 수 없습니다
- 날짜 형식은 YYYY-MM-DD를 엄격히 따라야 합니다
- 존재하지 않는 `conferenceId`를 설정하면 참조 무결성 오류가 발생할 수 있습니다

### 동시성 제어
- 여러 사용자가 동시에 같은 보고서를 수정할 수 있으므로 주의가 필요합니다
- 중요한 수정 작업 전에는 최신 데이터를 먼저 조회하는 것을 권장합니다

### 성능 고려사항
- 일괄 수정 시 적절한 지연 시간을 두어 서버 부하를 방지하세요
- 대량 수정 작업은 배치 단위로 나누어 진행하세요

이 API를 통해 보고서 정보를 효율적으로 관리하고 업데이트할 수 있습니다.