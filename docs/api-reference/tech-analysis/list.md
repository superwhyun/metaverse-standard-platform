# 기술 분석 보고서 목록 조회 API

## 개요

기술 분석 보고서 목록을 조회합니다. 페이지네이션, 검색, 카테고리 필터링을 지원합니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/tech-analysis`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 기본값 | 예시 |
|----------|------|------|------|--------|------|
| `limit` | number | ❌ | 한 페이지당 항목 수 | `8` | `limit=10` |
| `offset` | number | ❌ | 시작 위치 | `0` | `offset=0` |
| `search` | string | ❌ | 검색어 (제목, 요약에서 검색) | `""` | `search=AI` |
| `category` | string | ❌ | 카테고리 필터 | `""` | `category=인공지능` |

```http
GET /api/tech-analysis?limit=10&offset=0&search=AI&category=인공지능
```

### 요청 예시

```bash
# 기본 목록 조회
curl "https://your-domain.com/api/tech-analysis"

# 검색어로 조회
curl "https://your-domain.com/api/tech-analysis?search=메타버스"

# 카테고리 필터
curl "https://your-domain.com/api/tech-analysis?category=인공지능"

# 페이지네이션
curl "https://your-domain.com/api/tech-analysis?limit=5&offset=10"
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "data": [
    {
      "id": 1,
      "title": "메타버스 기술 동향 분석",
      "summary": "2024년 메타버스 기술의 주요 발전 현황과 전망을 분석합니다.",
      "url": "https://example.com/metaverse-trends-2024",
      "image_url": "https://example.com/images/metaverse.jpg",
      "category_name": "메타버스",
      "status": "completed",
      "created_at": "2024-08-25T10:00:00.000Z",
      "updated_at": "2024-08-25T10:05:00.000Z"
    },
    {
      "id": 2,
      "title": "AI 윤리 가이드라인 최신 동향",
      "summary": "인공지능 윤리에 대한 최신 국제 표준 및 가이드라인 현황",
      "url": "https://example.com/ai-ethics-guidelines",
      "image_url": null,
      "category_name": "인공지능",
      "status": "completed",
      "created_at": "2024-08-24T15:30:00.000Z",
      "updated_at": "2024-08-24T15:35:00.000Z"
    }
  ],
  "total": 25,
  "hasMore": true,
  "currentPage": 1,
  "totalPages": 4
}
```

### 에러 응답 (500)

```json
{
  "message": "Failed to fetch tech analysis reports"
}
```

## 실용적인 사용 예시

### 1. 기본 목록 조회

```javascript
async function getTechAnalysisReports(apiUrl, options = {}) {
  try {
    const {
      limit = 8,
      offset = 0,
      search = '',
      category = ''
    } = options;

    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (search) params.append('search', search);
    if (category) params.append('category', category);

    const response = await fetch(`${apiUrl}/api/tech-analysis?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('기술 분석 보고서 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
const reports = await getTechAnalysisReports('https://your-domain.com', {
  limit: 10,
  offset: 0,
  search: '메타버스',
  category: '기술동향'
});

console.log(`총 ${reports.total}개 보고서 중 ${reports.data.length}개 조회`);
reports.data.forEach(report => {
  console.log(`- ${report.title} (${report.category_name})`);
});
```

### 2. 페이지네이션 구현

```javascript
class TechAnalysisReportPaginator {
  constructor(apiUrl, pageSize = 8) {
    this.apiUrl = apiUrl;
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = 0;
    this.totalItems = 0;
    this.filters = {
      search: '',
      category: ''
    };
  }

  async loadPage(page = 1) {
    try {
      const offset = (page - 1) * this.pageSize;
      
      const data = await getTechAnalysisReports(this.apiUrl, {
        limit: this.pageSize,
        offset,
        search: this.filters.search,
        category: this.filters.category
      });

      this.currentPage = page;
      this.totalItems = data.total;
      this.totalPages = Math.ceil(data.total / this.pageSize);

      return {
        reports: data.data,
        pagination: {
          currentPage: this.currentPage,
          totalPages: this.totalPages,
          totalItems: this.totalItems,
          hasMore: data.hasMore,
          hasPrevious: this.currentPage > 1
        }
      };
    } catch (error) {
      console.error('페이지 로딩 실패:', error);
      throw error;
    }
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      return await this.loadPage(this.currentPage + 1);
    }
    throw new Error('다음 페이지가 없습니다.');
  }

  async previousPage() {
    if (this.currentPage > 1) {
      return await this.loadPage(this.currentPage - 1);
    }
    throw new Error('이전 페이지가 없습니다.');
  }

  async setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
    return await this.loadPage(1); // 필터 변경 시 첫 페이지로
  }

  async search(searchTerm) {
    return await this.setFilters({ search: searchTerm });
  }

  async filterByCategory(category) {
    return await this.setFilters({ category });
  }

  getPageInfo() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.totalItems,
      pageSize: this.pageSize,
      filters: this.filters
    };
  }
}

// 사용 예시
const paginator = new TechAnalysisReportPaginator('https://your-domain.com', 10);

// 첫 페이지 로드
const firstPage = await paginator.loadPage(1);
console.log('첫 페이지:', firstPage.reports.length, '개 항목');
console.log('페이지 정보:', firstPage.pagination);

// 검색
const searchResults = await paginator.search('AI');
console.log('검색 결과:', searchResults.reports.length, '개 항목');

// 다음 페이지
try {
  const nextPage = await paginator.nextPage();
  console.log('다음 페이지:', nextPage.reports.length, '개 항목');
} catch (error) {
  console.log('더 이상 페이지가 없습니다.');
}
```

### 3. 실시간 검색 구현

```javascript
class TechAnalysisRealTimeSearch {
  constructor(apiUrl, options = {}) {
    this.apiUrl = apiUrl;
    this.debounceDelay = options.debounceDelay || 300;
    this.minQueryLength = options.minQueryLength || 2;
    this.cache = new Map();
    this.debounceTimer = null;
  }

  async search(query, filters = {}, callback) {
    // 디바운스 처리
    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(async () => {
      if (query.length < this.minQueryLength) {
        callback({ data: [], total: 0, query: '' });
        return;
      }

      try {
        const cacheKey = JSON.stringify({ query, filters });
        
        // 캐시 확인
        if (this.cache.has(cacheKey)) {
          callback(this.cache.get(cacheKey));
          return;
        }

        // API 검색 실행
        const results = await getTechAnalysisReports(this.apiUrl, {
          search: query,
          category: filters.category || '',
          limit: filters.limit || 20,
          offset: 0
        });

        // 캐시에 저장
        this.cache.set(cacheKey, results);

        // 캐시 크기 제한 (최대 50개)
        if (this.cache.size > 50) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }

        callback(results);

      } catch (error) {
        callback({ error: error.message, data: [], total: 0 });
      }
    }, this.debounceDelay);
  }

  clearCache() {
    this.cache.clear();
  }

  getSuggestions(query, allReports) {
    const suggestions = new Set();
    const lowerQuery = query.toLowerCase();

    allReports.forEach(report => {
      // 제목에서 단어 추출
      const titleWords = report.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.includes(lowerQuery) && word.length > 2) {
          suggestions.add(word);
        }
      });

      // 카테고리 추천
      if (report.category_name && 
          report.category_name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(report.category_name);
      }
    });

    return Array.from(suggestions).slice(0, 8);
  }
}

// 사용 예시
const realTimeSearch = new TechAnalysisRealTimeSearch('https://your-domain.com', {
  debounceDelay: 300,
  minQueryLength: 2
});

// HTML 검색 입력 이벤트 핸들러
function handleSearchInput(event) {
  const query = event.target.value;
  
  realTimeSearch.search(query, { 
    category: document.getElementById('categoryFilter')?.value || '',
    limit: 10
  }, (results) => {
    if (results.error) {
      console.error('검색 오류:', results.error);
      displaySearchResults([]);
      return;
    }

    console.log(`"${query}" 검색 결과: ${results.total}개`);
    displaySearchResults(results.data);
  });
}

function displaySearchResults(reports) {
  const resultsContainer = document.getElementById('searchResults');
  
  if (reports.length === 0) {
    resultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
    return;
  }

  resultsContainer.innerHTML = reports.map(report => `
    <div class="search-result-item">
      <div class="result-header">
        <h3><a href="${report.url}" target="_blank">${report.title}</a></h3>
        <span class="category">${report.category_name || '기타'}</span>
      </div>
      <p class="summary">${report.summary.substring(0, 200)}...</p>
      <div class="result-meta">
        <span class="date">${new Date(report.created_at).toLocaleDateString()}</span>
        <span class="status ${report.status}">${report.status}</span>
      </div>
      ${report.image_url ? `<img src="${report.image_url}" alt="썸네일" class="thumbnail">` : ''}
    </div>
  `).join('');
}
```

### 4. 카테고리별 분석

```javascript
async function analyzeTechReportsByCategory(apiUrl) {
  try {
    // 전체 데이터 조회
    const allReports = await getTechAnalysisReports(apiUrl, {
      limit: 1000, // 충분히 큰 수로 전체 조회
      offset: 0
    });

    // 카테고리별 분석
    const categoryAnalysis = {};
    const statusAnalysis = {
      completed: 0,
      pending: 0,
      failed: 0
    };

    allReports.data.forEach(report => {
      // 카테고리 분석
      const category = report.category_name || '기타';
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          count: 0,
          reports: [],
          latestReport: null,
          avgSummaryLength: 0
        };
      }
      
      categoryAnalysis[category].count++;
      categoryAnalysis[category].reports.push({
        id: report.id,
        title: report.title,
        created_at: report.created_at
      });

      // 최신 보고서 업데이트
      if (!categoryAnalysis[category].latestReport || 
          new Date(report.created_at) > new Date(categoryAnalysis[category].latestReport.created_at)) {
        categoryAnalysis[category].latestReport = report;
      }

      // 상태별 분석
      statusAnalysis[report.status] = (statusAnalysis[report.status] || 0) + 1;
    });

    // 카테고리별 평균 요약 길이 계산
    Object.keys(categoryAnalysis).forEach(category => {
      const reports = categoryAnalysis[category].reports;
      const avgLength = allReports.data
        .filter(r => (r.category_name || '기타') === category)
        .reduce((sum, r) => sum + r.summary.length, 0) / reports.length;
      
      categoryAnalysis[category].avgSummaryLength = Math.round(avgLength);
    });

    // 정렬
    const sortedCategories = Object.entries(categoryAnalysis)
      .sort(([,a], [,b]) => b.count - a.count);

    // 최근 30일 동향
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReports = allReports.data.filter(report => 
      new Date(report.created_at) >= thirtyDaysAgo
    );

    const dailyTrends = {};
    recentReports.forEach(report => {
      const date = report.created_at.split('T')[0];
      dailyTrends[date] = (dailyTrends[date] || 0) + 1;
    });

    return {
      overview: {
        totalReports: allReports.total,
        totalCategories: Object.keys(categoryAnalysis).length,
        recentReports: recentReports.length
      },
      categoryAnalysis: sortedCategories,
      statusAnalysis,
      dailyTrends: Object.entries(dailyTrends)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30), // 최근 30일
      topCategories: sortedCategories.slice(0, 5),
      latestReports: allReports.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
    };
  } catch (error) {
    console.error('카테고리별 분석 실패:', error);
    throw error;
  }
}

// 사용 예시
const analysis = await analyzeTechReportsByCategory('https://your-domain.com');

console.log('=== 기술 분석 보고서 통계 ===');
console.log(`총 보고서 수: ${analysis.overview.totalReports}개`);
console.log(`총 카테고리 수: ${analysis.overview.totalCategories}개`);
console.log(`최근 30일 보고서: ${analysis.overview.recentReports}개`);

console.log('\n=== 상위 5개 카테고리 ===');
analysis.topCategories.forEach(([category, data], index) => {
  console.log(`${index + 1}. ${category}: ${data.count}개 (최신: ${data.latestReport?.title})`);
});

console.log('\n=== 처리 상태 현황 ===');
Object.entries(analysis.statusAnalysis).forEach(([status, count]) => {
  console.log(`${status}: ${count}개`);
});
```

### 5. 보고서 내보내기 기능

```javascript
async function exportTechAnalysisReports(apiUrl, options = {}) {
  try {
    const {
      format = 'csv', // csv, json, excel
      filters = {},
      includeAll = true
    } = options;

    // 전체 데이터 조회
    let allReports = [];
    if (includeAll) {
      allReports = await getTechAnalysisReports(apiUrl, {
        limit: 10000,
        offset: 0,
        search: filters.search || '',
        category: filters.category || ''
      });
      allReports = allReports.data;
    } else {
      const result = await getTechAnalysisReports(apiUrl, filters);
      allReports = result.data;
    }

    switch (format) {
      case 'csv':
        return exportToCSV(allReports);
      case 'json':
        return exportToJSON(allReports, filters);
      case 'excel':
        return exportToExcel(allReports);
      default:
        throw new Error('지원하지 않는 형식입니다.');
    }
  } catch (error) {
    console.error('내보내기 실패:', error);
    throw error;
  }
}

function exportToCSV(reports) {
  const headers = ['ID', '제목', '요약', 'URL', '카테고리', '상태', '생성일', '이미지URL'];
  const csvContent = [
    headers.join(','),
    ...reports.map(report => [
      report.id,
      `"${report.title.replace(/"/g, '""')}"`,
      `"${report.summary.replace(/"/g, '""')}"`,
      `"${report.url}"`,
      `"${report.category_name || ''}"`,
      report.status,
      report.created_at.split('T')[0],
      `"${report.image_url || ''}"`
    ].join(','))
  ].join('\n');

  const filename = `tech-analysis-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  
  return { content: csvContent, filename };
}

function exportToJSON(reports, filters) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    filters,
    totalReports: reports.length,
    reports: reports.map(report => ({
      ...report,
      exportedAt: new Date().toISOString()
    }))
  };

  const content = JSON.stringify(exportData, null, 2);
  const filename = `tech-analysis-reports-${new Date().toISOString().slice(0, 10)}.json`;

  return { content, filename };
}

// 브라우저에서 다운로드
function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

// 사용 예시
const csvExport = await exportTechAnalysisReports('https://your-domain.com', {
  format: 'csv',
  filters: { category: '인공지능' },
  includeAll: true
});

// 브라우저에서 다운로드
downloadFile(csvExport.content, csvExport.filename, 'text/csv');

const jsonExport = await exportTechAnalysisReports('https://your-domain.com', {
  format: 'json',
  filters: { search: 'AI' }
});

downloadFile(jsonExport.content, jsonExport.filename, 'application/json');
```

### 6. 보고서 피드 (RSS 스타일)

```javascript
class TechAnalysisReportFeed {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.lastFetchTime = null;
    this.subscribers = [];
  }

  async getLatestReports(since = null) {
    try {
      const reports = await getTechAnalysisReports(this.apiUrl, {
        limit: 50,
        offset: 0
      });

      let filteredReports = reports.data;

      // since 시점 이후 보고서만 필터링
      if (since) {
        const sinceDate = new Date(since);
        filteredReports = reports.data.filter(report => 
          new Date(report.created_at) > sinceDate
        );
      }

      return {
        reports: filteredReports,
        total: filteredReports.length,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('최신 보고서 조회 실패:', error);
      throw error;
    }
  }

  async checkForUpdates() {
    try {
      const since = this.lastFetchTime;
      const result = await this.getLatestReports(since);
      
      this.lastFetchTime = result.fetchedAt;

      if (result.reports.length > 0) {
        // 구독자들에게 새 보고서 알림
        this.notifySubscribers(result.reports);
        return result.reports;
      }

      return [];
    } catch (error) {
      console.error('업데이트 확인 실패:', error);
      return [];
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  notifySubscribers(newReports) {
    this.subscribers.forEach(callback => {
      try {
        callback(newReports);
      } catch (error) {
        console.error('구독자 알림 오류:', error);
      }
    });
  }

  startPolling(intervalMs = 60000) { // 1분마다 체크
    const pollInterval = setInterval(async () => {
      try {
        await this.checkForUpdates();
      } catch (error) {
        console.error('폴링 오류:', error);
      }
    }, intervalMs);

    return () => clearInterval(pollInterval);
  }

  generateRSSFeed(reports, options = {}) {
    const {
      title = 'Tech Analysis Reports Feed',
      description = 'Latest technology analysis reports',
      link = 'https://your-domain.com/tech-analysis'
    } = options;

    const rssItems = reports.map(report => `
      <item>
        <title><![CDATA[${report.title}]]></title>
        <description><![CDATA[${report.summary}]]></description>
        <link>${report.url}</link>
        <guid>${report.url}</guid>
        <pubDate>${new Date(report.created_at).toUTCString()}</pubDate>
        <category>${report.category_name || 'General'}</category>
        ${report.image_url ? `<enclosure url="${report.image_url}" type="image/jpeg"/>` : ''}
      </item>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${title}</title>
    <description>${description}</description>
    <link>${link}</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>ko</language>
    ${rssItems}
  </channel>
</rss>`;
  }
}

// 사용 예시
const feed = new TechAnalysisReportFeed('https://your-domain.com');

// 새 보고서 구독
const unsubscribe = feed.subscribe((newReports) => {
  console.log(`🔔 새로운 보고서 ${newReports.length}개 발견:`);
  newReports.forEach(report => {
    console.log(`  - ${report.title}`);
  });
});

// 폴링 시작
const stopPolling = feed.startPolling(30000); // 30초마다 체크

// RSS 피드 생성
const latestReports = await feed.getLatestReports();
const rssContent = feed.generateRSSFeed(latestReports.reports, {
  title: 'My Tech Analysis Feed',
  description: 'Latest technology trends and analysis'
});

console.log('RSS 피드 생성 완료');
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `data` | array | 보고서 목록 | `[{...}]` |
| `data[].id` | number | 보고서 ID | `1` |
| `data[].title` | string | 보고서 제목 | `"메타버스 기술 동향"` |
| `data[].summary` | string | 보고서 요약 | `"2024년 메타버스..."` |
| `data[].url` | string | 원본 URL | `"https://example.com"` |
| `data[].image_url` | string\|null | 썸네일 이미지 URL | `"https://..."` |
| `data[].category_name` | string\|null | 카테고리명 | `"메타버스"` |
| `data[].status` | string | 처리 상태 | `"completed"`, `"pending"`, `"failed"` |
| `data[].created_at` | string | 생성 일시 | `"2024-08-25T10:00:00.000Z"` |
| `data[].updated_at` | string | 수정 일시 | `"2024-08-25T10:05:00.000Z"` |
| `total` | number | 전체 항목 수 | `25` |
| `hasMore` | boolean | 다음 페이지 존재 여부 | `true` |
| `currentPage` | number | 현재 페이지 번호 | `1` |
| `totalPages` | number | 전체 페이지 수 | `4` |

이 API를 통해 기술 분석 보고서를 효율적으로 조회하고 관리할 수 있습니다.