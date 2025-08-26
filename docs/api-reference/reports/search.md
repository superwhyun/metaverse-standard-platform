# 보고서 검색 API

## 개요

제목, 요약, 태그를 기반으로 보고서를 검색합니다. 카테고리, 기관별 필터링과 페이지네이션을 지원합니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/reports/search`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `q` | string | ❌* | 검색어 (제목, 요약, 태그에서 검색) | `q=메타버스` |
| `category` | string | ❌* | 카테고리 필터 | `category=표준` |
| `organization` | string | ❌* | 기관 필터 | `organization=ITU` |
| `limit` | number | ❌ | 한 페이지당 항목 수 (기본값: 20) | `limit=10` |
| `offset` | number | ❌ | 시작 위치 (기본값: 0) | `offset=0` |

> *최소 하나의 검색 조건(`q`, `category`, `organization`)이 필요합니다.

### 요청 예시

```bash
# 키워드 검색
curl "https://your-domain.com/api/reports/search?q=메타버스"

# 카테고리 필터
curl "https://your-domain.com/api/reports/search?category=표준"

# 기관 필터
curl "https://your-domain.com/api/reports/search?organization=ITU"

# 복합 검색
curl "https://your-domain.com/api/reports/search?q=표준화&category=표준&organization=ITU&limit=5"
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "title": "ITU-T SG16 메타버스 표준화 현황",
      "date": "2024-08-24",
      "summary": "ITU-T Study Group 16에서 진행 중인 메타버스 관련 표준화 작업의 현황",
      "category": "표준",
      "organization": "ITU",
      "tags": ["메타버스", "ITU-T", "SG16", "표준화"],
      "download_url": "https://example.com/reports/itu-sg16-2024.pdf",
      "conference_id": 123
    }
  ],
  "total": 1,
  "hasMore": false,
  "query": {
    "query": "메타버스",
    "category": "",
    "organization": "",
    "limit": 20,
    "offset": 0
  }
}
```

### 에러 응답

#### 검색 조건 없음 (400)
```json
{
  "success": false,
  "error": "Search query or filters required"
}
```

#### 서버 오류 (500)
```json
{
  "success": false,
  "error": "Failed to search reports"
}
```

## 실용적인 사용 예시

### 1. 기본 키워드 검색

```javascript
async function searchReports(apiUrl, searchQuery, options = {}) {
  const {
    category = '',
    organization = '',
    limit = 20,
    offset = 0
  } = options;

  const params = new URLSearchParams();
  if (searchQuery) params.append('q', searchQuery);
  if (category) params.append('category', category);
  if (organization) params.append('organization', organization);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  try {
    const response = await fetch(`${apiUrl}/api/reports/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('보고서 검색 실패:', error);
    throw error;
  }
}

// 사용 예시
const results = await searchReports('https://your-domain.com', '메타버스', {
  category: '표준',
  limit: 10
});

console.log(`검색 결과: ${results.total}개`);
results.data.forEach(report => {
  console.log(`- ${report.title} (${report.organization})`);
});
```

### 2. 고급 검색 인터페이스

```javascript
class ReportSearchEngine {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async search(criteria) {
    const {
      keywords,
      category,
      organization,
      dateRange,
      tags,
      limit = 20,
      offset = 0
    } = criteria;

    // 기본 검색 실행
    let searchParams = {};
    if (keywords) searchParams.q = keywords;
    if (category) searchParams.category = category;
    if (organization) searchParams.organization = organization;

    const results = await searchReports(this.apiUrl, keywords, {
      category,
      organization,
      limit: 1000, // 전체 결과를 가져와서 클라이언트에서 추가 필터링
      offset: 0
    });

    let filteredReports = results.data;

    // 날짜 범위 필터링
    if (dateRange && dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      filteredReports = filteredReports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= startDate && reportDate <= endDate;
      });
    }

    // 태그 필터링
    if (tags && tags.length > 0) {
      filteredReports = filteredReports.filter(report => {
        if (!report.tags || !Array.isArray(report.tags)) return false;
        return tags.some(tag => 
          report.tags.some(reportTag => 
            reportTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
      });
    }

    // 페이지네이션 적용
    const paginatedReports = filteredReports.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedReports,
      total: filteredReports.length,
      hasMore: offset + limit < filteredReports.length,
      criteria
    };
  }

  async searchByCategory(category, options = {}) {
    return this.search({ category, ...options });
  }

  async searchByOrganization(organization, options = {}) {
    return this.search({ organization, ...options });
  }

  async searchByKeywords(keywords, options = {}) {
    return this.search({ keywords, ...options });
  }

  async searchByDateRange(startDate, endDate, options = {}) {
    return this.search({ 
      dateRange: { start: startDate, end: endDate }, 
      ...options 
    });
  }

  async searchByTags(tags, options = {}) {
    return this.search({ tags, ...options });
  }

  async getSearchSuggestions(partial) {
    // 부분 검색어로 제안 생성
    try {
      const allResults = await searchReports(this.apiUrl, partial, { limit: 100 });
      
      const suggestions = new Set();
      
      allResults.data.forEach(report => {
        // 제목에서 제안 추출
        const titleWords = report.title.toLowerCase().split(/\s+/);
        titleWords.forEach(word => {
          if (word.includes(partial.toLowerCase()) && word.length > 2) {
            suggestions.add(word);
          }
        });

        // 태그에서 제안 추출
        if (report.tags && Array.isArray(report.tags)) {
          report.tags.forEach(tag => {
            if (tag.toLowerCase().includes(partial.toLowerCase())) {
              suggestions.add(tag);
            }
          });
        }
      });

      return Array.from(suggestions).slice(0, 10);
    } catch (error) {
      console.error('제안 검색 실패:', error);
      return [];
    }
  }
}

// 사용 예시
const searchEngine = new ReportSearchEngine('https://your-domain.com');

// 복합 조건 검색
const complexSearch = await searchEngine.search({
  keywords: '표준화',
  category: '표준',
  organization: 'ITU',
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  },
  tags: ['메타버스', 'VR'],
  limit: 10
});

// 카테고리별 검색
const standardReports = await searchEngine.searchByCategory('표준');

// 기관별 검색
const ituReports = await searchEngine.searchByOrganization('ITU');

// 태그 기반 검색
const metaverseReports = await searchEngine.searchByTags(['메타버스', 'AR', 'VR']);

// 검색 제안
const suggestions = await searchEngine.getSearchSuggestions('메타');
console.log('검색 제안:', suggestions);
```

### 3. 실시간 검색 (타이핑 기반)

```javascript
class RealTimeSearch {
  constructor(apiUrl, options = {}) {
    this.apiUrl = apiUrl;
    this.debounceDelay = options.debounceDelay || 300;
    this.minQueryLength = options.minQueryLength || 2;
    this.cache = new Map();
    this.debounceTimer = null;
  }

  async startSearch(query, callback, filters = {}) {
    // 디바운스 처리
    clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(async () => {
      if (query.length < this.minQueryLength) {
        callback({ data: [], total: 0, query });
        return;
      }

      try {
        const cacheKey = JSON.stringify({ query, filters });
        
        // 캐시 확인
        if (this.cache.has(cacheKey)) {
          callback(this.cache.get(cacheKey));
          return;
        }

        // 검색 실행
        const results = await searchReports(this.apiUrl, query, {
          category: filters.category,
          organization: filters.organization,
          limit: filters.limit || 10
        });

        // 캐시에 저장
        this.cache.set(cacheKey, results);

        // 캐시 크기 제한
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
}

// 사용 예시 (웹 인터페이스)
const realTimeSearch = new RealTimeSearch('https://your-domain.com', {
  debounceDelay: 300,
  minQueryLength: 2
});

// 검색 입력 이벤트 핸들러
function handleSearchInput(event) {
  const query = event.target.value;
  
  realTimeSearch.startSearch(query, (results) => {
    if (results.error) {
      console.error('검색 오류:', results.error);
      displaySearchResults([]);
      return;
    }

    console.log(`"${query}" 검색 결과: ${results.total}개`);
    displaySearchResults(results.data);
  }, {
    category: document.getElementById('categoryFilter').value,
    organization: document.getElementById('orgFilter').value,
    limit: 8
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
      <h3>${report.title}</h3>
      <p class="summary">${report.summary.substring(0, 150)}...</p>
      <div class="metadata">
        <span class="organization">${report.organization}</span>
        <span class="category">${report.category}</span>
        <span class="date">${report.date}</span>
      </div>
      <div class="tags">
        ${report.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  `).join('');
}
```

### 4. 검색 분석 및 통계

```javascript
async function searchAnalytics(apiUrl, searchQueries) {
  const analytics = {
    queries: [],
    totalResults: 0,
    popularCategories: {},
    popularOrganizations: {},
    popularTags: {},
    searchTrends: {}
  };

  for (const query of searchQueries) {
    try {
      const results = await searchReports(apiUrl, query, { limit: 1000 });
      
      analytics.queries.push({
        query,
        resultCount: results.total,
        timestamp: new Date().toISOString()
      });

      analytics.totalResults += results.total;

      // 카테고리 통계
      results.data.forEach(report => {
        analytics.popularCategories[report.category] = 
          (analytics.popularCategories[report.category] || 0) + 1;
        
        analytics.popularOrganizations[report.organization] = 
          (analytics.popularOrganizations[report.organization] || 0) + 1;

        if (report.tags && Array.isArray(report.tags)) {
          report.tags.forEach(tag => {
            analytics.popularTags[tag] = 
              (analytics.popularTags[tag] || 0) + 1;
          });
        }
      });

    } catch (error) {
      console.error(`검색 실패: "${query}"`, error);
    }

    // API 부하 방지
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 정렬
  analytics.popularCategories = Object.entries(analytics.popularCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  analytics.popularOrganizations = Object.entries(analytics.popularOrganizations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  analytics.popularTags = Object.entries(analytics.popularTags)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20);

  return analytics;
}

// 사용 예시
const searchQueries = ['메타버스', '표준화', 'VR', 'AR', 'XR', 'ITU', 'ISO'];
const analytics = await searchAnalytics('https://your-domain.com', searchQueries);

console.log('검색 분석 결과:');
console.log('인기 카테고리:', analytics.popularCategories);
console.log('인기 기관:', analytics.popularOrganizations);
console.log('인기 태그:', analytics.popularTags);
```

### 5. 내보내기 기능

```javascript
async function exportSearchResults(apiUrl, searchCriteria, format = 'csv') {
  try {
    // 모든 검색 결과 가져오기
    const allResults = await searchReports(apiUrl, searchCriteria.query, {
      category: searchCriteria.category,
      organization: searchCriteria.organization,
      limit: 10000,
      offset: 0
    });

    const reports = allResults.data;

    if (format === 'csv') {
      return exportToCSV(reports, searchCriteria);
    } else if (format === 'json') {
      return exportToJSON(reports, searchCriteria);
    } else if (format === 'excel') {
      return exportToExcel(reports, searchCriteria);
    }

  } catch (error) {
    console.error('내보내기 실패:', error);
    throw error;
  }
}

function exportToCSV(reports, criteria) {
  const headers = ['ID', '제목', '날짜', '기관', '카테고리', '태그', '요약'];
  const csvContent = [
    headers.join(','),
    ...reports.map(report => [
      report.id,
      `"${report.title.replace(/"/g, '""')}"`,
      report.date,
      report.organization,
      report.category,
      `"${Array.isArray(report.tags) ? report.tags.join(', ') : ''}"`,
      `"${report.summary.replace(/"/g, '""').substring(0, 100)}..."`
    ].join(','))
  ].join('\n');

  const filename = `search-results-${criteria.query || 'filtered'}-${new Date().toISOString().slice(0, 10)}.csv`;
  
  // Node.js 환경
  if (typeof require !== 'undefined') {
    require('fs').writeFileSync(filename, csvContent, 'utf8');
    console.log(`CSV 파일 저장: ${filename}`);
  }
  
  return { content: csvContent, filename };
}

function exportToJSON(reports, criteria) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    searchCriteria: criteria,
    totalResults: reports.length,
    reports: reports
  };

  const content = JSON.stringify(exportData, null, 2);
  const filename = `search-results-${criteria.query || 'filtered'}-${new Date().toISOString().slice(0, 10)}.json`;

  // Node.js 환경
  if (typeof require !== 'undefined') {
    require('fs').writeFileSync(filename, content, 'utf8');
    console.log(`JSON 파일 저장: ${filename}`);
  }

  return { content, filename };
}

// 사용 예시
const searchResults = await exportSearchResults('https://your-domain.com', {
  query: '메타버스',
  category: '표준',
  organization: 'ITU'
}, 'csv');

console.log(`검색 결과를 ${searchResults.filename}로 내보냈습니다.`);
```

## 검색 최적화 팁

### 1. 효과적인 검색어 사용
- **구체적인 키워드**: "메타버스 표준화" > "표준"
- **기관명 활용**: "ITU", "ISO", "IEEE" 등
- **기술 용어**: "VR", "AR", "XR", "디지털트윈" 등

### 2. 필터 조합 활용
```javascript
// 효과적인 검색 예시
const targetedSearch = await searchReports(apiUrl, '메타버스', {
  category: '표준',        // 카테고리로 범위 좁히기
  organization: 'ITU',     // 특정 기관으로 한정
  limit: 10               // 적절한 결과 수 제한
});
```

### 3. 페이지네이션 활용
대량 결과에 대해서는 페이지네이션을 활용하여 성능을 최적화하세요:

```javascript
async function getAllSearchResults(apiUrl, query, options = {}) {
  const allResults = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const results = await searchReports(apiUrl, query, {
      ...options,
      limit,
      offset
    });

    allResults.push(...results.data);
    offset += limit;
    hasMore = results.hasMore;

    console.log(`로드됨: ${allResults.length}/${results.total}`);
  }

  return allResults;
}
```

이 검색 API를 통해 보고서 데이터를 효율적으로 찾고 분석할 수 있습니다.