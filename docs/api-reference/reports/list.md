# 보고서 목록 조회 API

## 개요

등록된 보고서 목록을 조회합니다. 페이지네이션, 월별 필터링, 검색 기능을 지원합니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/reports`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

### 기본 요청
```http
GET /api/reports
```

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `limit` | number | ❌ | 한 페이지당 항목 수 (기본값: 50) | `limit=10` |
| `offset` | number | ❌ | 시작 위치 (기본값: 0) | `offset=20` |
| `year` | number | ❌ | 필터링할 연도 | `year=2024` |
| `month` | number | ❌ | 필터링할 월 (1-12) | `month=8` |
| `includeContent` | boolean | ❌ | 본문 내용 포함 여부 | `includeContent=true` |

### 요청 예시

```bash
# 기본 목록 조회 (최신 50개)
curl https://your-domain.com/api/reports

# 페이지네이션 (21번째부터 10개)
curl "https://your-domain.com/api/reports?limit=10&offset=20"

# 2024년 8월 보고서만 조회
curl "https://your-domain.com/api/reports?year=2024&month=8"

# 본문 내용까지 포함하여 조회
curl "https://your-domain.com/api/reports?includeContent=true&limit=5"
```

## 응답 형식

### 성공 응답 (200)

#### 기본 응답 (본문 내용 제외)
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "title": "ITU-T SG16 메타버스 표준화 현황",
      "date": "2024-08-24",
      "summary": "ITU-T SG16의 메타버스 관련 표준화 현황을 정리한 보고서",
      "category": "표준",
      "organization": "ITU",
      "tags": ["메타버스", "ITU-T", "표준화"],
      "download_url": "https://example.com/reports/itu-sg16-2024.pdf",
      "conference_id": 123
    },
    {
      "id": 455,
      "title": "ISO 메타버스 표준 동향",
      "date": "2024-08-23",
      "summary": "ISO의 메타버스 관련 표준화 작업 현황",
      "category": "표준",
      "organization": "ISO",
      "tags": ["메타버스", "ISO", "JTC1"],
      "download_url": null,
      "conference_id": null
    }
  ],
  "total": 245,
  "hasMore": true
}
```

#### 본문 내용 포함 응답 (`includeContent=true`)
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "title": "ITU-T SG16 메타버스 표준화 현황",
      "date": "2024-08-24",
      "summary": "ITU-T SG16의 메타버스 관련 표준화 현황을 정리한 보고서",
      "content": "## 개요\n\nITU-T Study Group 16은...\n\n### 주요 표준화 작업\n\n1. F.748.1 - Requirements for immersive services\n2. F.748.2 - Framework for immersive services\n\n## 결론\n\n메타버스 표준화는...",
      "category": "표준",
      "organization": "ITU",
      "tags": ["메타버스", "ITU-T", "표준화"],
      "download_url": "https://example.com/reports/itu-sg16-2024.pdf",
      "conference_id": 123
    }
  ],
  "total": 245,
  "hasMore": true
}
```

### 에러 응답 (500)
```json
{
  "success": false,
  "error": "Failed to get reports"
}
```

## 실용적인 사용 예시

### 1. 모든 보고서 목록 조회

```javascript
async function getAllReports(apiUrl) {
  const reports = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${apiUrl}/api/reports?limit=${limit}&offset=${offset}`);
    const data = await response.json();
    
    if (data.success) {
      reports.push(...data.data);
      offset += limit;
      hasMore = data.hasMore;
      
      console.log(`Loaded ${reports.length}/${data.total} reports`);
    } else {
      throw new Error('Failed to fetch reports');
    }
  }

  return reports;
}

// 사용
const allReports = await getAllReports('https://your-domain.com');
console.log(`Total reports loaded: ${allReports.length}`);
```

### 2. 특정 월의 보고서 조회

```javascript
async function getMonthlyReports(apiUrl, year, month) {
  const response = await fetch(
    `${apiUrl}/api/reports?year=${year}&month=${month}&includeContent=true`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

// 2024년 8월 보고서 조회
const augustReports = await getMonthlyReports('https://your-domain.com', 2024, 8);
console.log(`August 2024 reports: ${augustReports.length}`);
```

### 3. 특정 기관의 보고서 필터링

```javascript
async function getReportsByOrganization(apiUrl, organization) {
  const allReports = await getAllReports(apiUrl);
  return allReports.filter(report => 
    report.organization.toLowerCase().includes(organization.toLowerCase())
  );
}

// ITU 관련 보고서만 조회
const ituReports = await getReportsByOrganization('https://your-domain.com', 'ITU');
console.log(`ITU reports: ${ituReports.length}`);
```

### 4. 태그별 보고서 분류

```javascript
async function categorizeReportsByTags(apiUrl) {
  const reports = await getAllReports(apiUrl);
  const tagCategories = {};

  reports.forEach(report => {
    if (report.tags && Array.isArray(report.tags)) {
      report.tags.forEach(tag => {
        if (!tagCategories[tag]) {
          tagCategories[tag] = [];
        }
        tagCategories[tag].push(report);
      });
    }
  });

  return tagCategories;
}

// 태그별 분류
const categorized = await categorizeReportsByTags('https://your-domain.com');
console.log('메타버스 태그 보고서:', categorized['메타버스']?.length || 0);
console.log('표준화 태그 보고서:', categorized['표준화']?.length || 0);
```

### 5. 보고서 통계 생성

```javascript
async function generateReportStatistics(apiUrl) {
  const reports = await getAllReports(apiUrl);
  
  const stats = {
    total: reports.length,
    byOrganization: {},
    byCategory: {},
    byMonth: {},
    recentReports: reports.slice(0, 5).map(r => ({
      title: r.title,
      date: r.date,
      organization: r.organization
    }))
  };

  reports.forEach(report => {
    // 기관별 통계
    stats.byOrganization[report.organization] = 
      (stats.byOrganization[report.organization] || 0) + 1;

    // 카테고리별 통계
    stats.byCategory[report.category] = 
      (stats.byCategory[report.category] || 0) + 1;

    // 월별 통계
    const monthKey = report.date.substring(0, 7); // YYYY-MM
    stats.byMonth[monthKey] = 
      (stats.byMonth[monthKey] || 0) + 1;
  });

  return stats;
}

// 통계 생성
const stats = await generateReportStatistics('https://your-domain.com');
console.log('보고서 통계:', JSON.stringify(stats, null, 2));
```

### 6. CSV로 내보내기

```javascript
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function exportReportsToCSV(apiUrl, filename) {
  const reports = await getAllReports(apiUrl);
  
  const csvWriter = createCsvWriter({
    path: filename,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'title', title: 'Title' },
      { id: 'date', title: 'Date' },
      { id: 'organization', title: 'Organization' },
      { id: 'category', title: 'Category' },
      { id: 'tags', title: 'Tags' },
      { id: 'summary', title: 'Summary' }
    ]
  });

  const csvData = reports.map(report => ({
    ...report,
    tags: Array.isArray(report.tags) ? report.tags.join(', ') : ''
  }));

  await csvWriter.writeRecords(csvData);
  console.log(`Reports exported to ${filename}`);
}

// CSV 내보내기
await exportReportsToCSV('https://your-domain.com', 'reports_export.csv');
```

## 응답 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 보고서 고유 ID |
| `title` | string | 보고서 제목 |
| `date` | string | 보고서 날짜 (YYYY-MM-DD) |
| `summary` | string | 보고서 요약 |
| `content` | string | 보고서 본문 (includeContent=true 시에만) |
| `category` | string | 카테고리 |
| `organization` | string | 작성 기관 |
| `tags` | array | 태그 배열 |
| `download_url` | string\|null | 다운로드 URL |
| `conference_id` | number\|null | 연관된 회의 ID |

## 페이지네이션 처리

```javascript
class ReportPaginator {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async getPage(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...filters
    });

    const response = await fetch(`${this.apiUrl}/api/reports?${queryParams}`);
    const data = await response.json();
    
    return {
      reports: data.data,
      currentPage: page,
      totalPages: Math.ceil(data.total / limit),
      totalReports: data.total,
      hasNext: data.hasMore,
      hasPrev: page > 1
    };
  }

  async *getAllPages(limit = 20, filters = {}) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.getPage(page, limit, filters);
      yield result;
      hasMore = result.hasNext;
      page++;
    }
  }
}

// 사용 예시
const paginator = new ReportPaginator('https://your-domain.com');

// 특정 페이지 조회
const page2 = await paginator.getPage(2, 10, { year: 2024 });
console.log(`Page 2: ${page2.reports.length} reports`);

// 모든 페이지 순회
for await (const page of paginator.getAllPages(50)) {
  console.log(`Processing page ${page.currentPage}/${page.totalPages}`);
  // 각 페이지 처리...
}
```

이 API를 통해 등록된 모든 보고서 데이터를 효율적으로 조회하고 분석할 수 있습니다.