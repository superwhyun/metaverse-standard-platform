# 기관 상세 조회 API

## 개요

특정 기관의 상세 정보를 조회합니다. 기관 ID를 통해 개별 기관 정보를 확인할 수 있습니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/organizations/{id}`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 조회할 기관 ID | `1` |

```http
GET /api/organizations/{id}
```

### 요청 예시

```bash
curl https://your-domain.com/api/organizations/1
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "id": 1,
  "name": "ITU"
}
```

### 에러 응답

#### 잘못된 ID 형식 (400)
```json
{
  "message": "Invalid organization ID"
}
```

#### 기관 없음 (404)
```json
{
  "message": "Organization not found"
}
```

#### 서버 오류 (500)
```json
{
  "message": "Failed to fetch organization"
}
```

## 실용적인 사용 예시

### 1. 기관 상세 조회

```javascript
async function getOrganizationById(apiUrl, organizationId) {
  try {
    const response = await fetch(`${apiUrl}/api/organizations/${organizationId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('기관을 찾을 수 없습니다.');
      }
      if (response.status === 400) {
        throw new Error('유효하지 않은 기관 ID입니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const organization = await response.json();
    return organization;
  } catch (error) {
    console.error('기관 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const organization = await getOrganizationById('https://your-domain.com', 1);
  console.log('기관 정보:', organization);
} catch (error) {
  console.error('조회 실패:', error.message);
}
```

### 2. 기관 정보와 관련 보고서 함께 조회

```javascript
async function getOrganizationWithReports(apiUrl, organizationId, options = {}) {
  const { limit = 20, includeRecentOnly = true, includeStats = true } = options;
  
  try {
    // 기관 정보 조회
    const organization = await getOrganizationById(apiUrl, organizationId);
    
    // 관련 보고서 조회
    const reportsResponse = await fetch(`${apiUrl}/api/reports/search?organization=${encodeURIComponent(organization.name)}&limit=${limit}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    let reports = [];
    let totalReports = 0;
    
    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      reports = reportsData.data || [];
      totalReports = reportsData.total || reports.length;
    }
    
    // 최근 보고서만 필터링 (옵션)
    if (includeRecentOnly) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      reports = reports.filter(report => 
        new Date(report.date) >= sixMonthsAgo
      );
    }
    
    let statistics = null;
    
    if (includeStats && reports.length > 0) {
      // 카테고리별 분포 계산
      const categoryDistribution = {};
      reports.forEach(report => {
        categoryDistribution[report.category] = 
          (categoryDistribution[report.category] || 0) + 1;
      });
      
      // 월별 보고서 수 계산
      const monthlyDistribution = {};
      reports.forEach(report => {
        const month = report.date.substring(0, 7); // YYYY-MM 형식
        monthlyDistribution[month] = (monthlyDistribution[month] || 0) + 1;
      });
      
      // 연도별 분포
      const yearlyDistribution = {};
      reports.forEach(report => {
        const year = report.date.substring(0, 4);
        yearlyDistribution[year] = (yearlyDistribution[year] || 0) + 1;
      });
      
      // 태그 분석
      const tagDistribution = {};
      reports.forEach(report => {
        if (report.tags && Array.isArray(report.tags)) {
          report.tags.forEach(tag => {
            tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
          });
        }
      });
      
      statistics = {
        totalReports,
        recentReports: reports.length,
        categoryDistribution: Object.entries(categoryDistribution)
          .sort(([,a], [,b]) => b - a),
        monthlyDistribution: Object.entries(monthlyDistribution)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 12), // 최근 12개월
        yearlyDistribution: Object.entries(yearlyDistribution)
          .sort(([a], [b]) => b.localeCompare(a)),
        topTags: Object.entries(tagDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
        mostRecentReport: reports.length > 0 
          ? reports.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
          : null,
        oldestReport: reports.length > 0
          ? reports.sort((a, b) => new Date(a.date) - new Date(b.date))[0]
          : null,
        averageReportsPerMonth: calculateAverageReportsPerMonth(reports)
      };
    }
    
    return {
      organization,
      reports,
      statistics
    };
    
  } catch (error) {
    console.error('기관 및 보고서 조회 실패:', error);
    throw error;
  }
}

function calculateAverageReportsPerMonth(reports) {
  if (reports.length === 0) return 0;
  
  const dates = reports.map(r => new Date(r.date)).sort((a, b) => a - b);
  const oldestDate = dates[0];
  const newestDate = dates[dates.length - 1];
  
  const monthsDiff = (newestDate.getFullYear() - oldestDate.getFullYear()) * 12 + 
                     (newestDate.getMonth() - oldestDate.getMonth()) + 1;
  
  return (reports.length / monthsDiff).toFixed(2);
}

// 사용 예시
const organizationInfo = await getOrganizationWithReports('https://your-domain.com', 1, {
  limit: 50,
  includeRecentOnly: false,
  includeStats: true
});

console.log('기관:', organizationInfo.organization.name);
console.log('총 보고서 수:', organizationInfo.statistics?.totalReports);
console.log('주요 카테고리:', organizationInfo.statistics?.categoryDistribution.slice(0, 3));
console.log('최근 보고서:', organizationInfo.statistics?.mostRecentReport?.title);
```

### 3. 여러 기관 정보 한번에 조회

```javascript
async function getMultipleOrganizations(apiUrl, organizationIds, options = {}) {
  const { includeReports = false, batchSize = 5, concurrency = 3 } = options;
  
  const results = [];
  
  // 세마포어 패턴으로 동시 요청 수 제한
  const semaphore = Array(concurrency).fill(null);
  let activeRequests = 0;
  
  const processOrganization = async (organizationId) => {
    // 세마포어 획득 대기
    while (activeRequests >= concurrency) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    activeRequests++;
    
    try {
      if (includeReports) {
        return await getOrganizationWithReports(apiUrl, organizationId);
      } else {
        const organization = await getOrganizationById(apiUrl, organizationId);
        return { organization };
      }
    } catch (error) {
      return {
        organizationId,
        error: error.message,
        success: false
      };
    } finally {
      activeRequests--;
    }
  };
  
  // 배치 단위로 처리
  for (let i = 0; i < organizationIds.length; i += batchSize) {
    const batch = organizationIds.slice(i, i + batchSize);
    console.log(`📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중... (${batch.length}개)`);
    
    const batchPromises = batch.map(processOrganization);
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 배치 간 지연
    if (i + batchSize < organizationIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  return {
    successful,
    failed,
    summary: {
      total: organizationIds.length,
      successful: successful.length,
      failed: failed.length
    }
  };
}

// 사용 예시
const organizationIds = [1, 2, 3, 4, 5, 6, 7, 8];
const multipleOrganizations = await getMultipleOrganizations('https://your-domain.com', organizationIds, {
  includeReports: true,
  batchSize: 4,
  concurrency: 2
});

console.log(`조회 완료: ${multipleOrganizations.summary.successful}/${multipleOrganizations.summary.total}개`);
multipleOrganizations.successful.forEach(item => {
  const orgName = item.organization.name;
  const reportCount = item.statistics?.totalReports || 0;
  console.log(`- ${orgName}: ${reportCount}개 보고서`);
});
```

### 4. 기관 존재 여부 확인

```javascript
async function checkOrganizationExists(apiUrl, organizationId) {
  try {
    const response = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
      method: 'HEAD' // HEAD 메서드로 헤더만 요청
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

// HEAD가 지원되지 않는 경우의 대안
async function checkOrganizationExistsAlternative(apiUrl, organizationId) {
  try {
    await getOrganizationById(apiUrl, organizationId);
    return true;
  } catch (error) {
    return false;
  }
}

// 여러 기관 존재 확인
async function checkMultipleOrganizationsExist(apiUrl, organizationIds) {
  const results = await Promise.all(
    organizationIds.map(async (id) => ({
      id,
      exists: await checkOrganizationExists(apiUrl, id)
    }))
  );
  
  return results;
}

// 사용 예시
const exists = await checkOrganizationExists('https://your-domain.com', 1);
console.log('기관 존재 여부:', exists);

const existenceCheck = await checkMultipleOrganizationsExist('https://your-domain.com', [1, 2, 99, 100]);
console.log('존재 확인 결과:', existenceCheck);
```

### 5. 기관 정보 캐싱 시스템

```javascript
class OrganizationCache {
  constructor(apiUrl, cacheTimeout = 5 * 60 * 1000) { // 5분 캐시
    this.apiUrl = apiUrl;
    this.cache = new Map();
    this.reportCache = new Map();
    this.cacheTimeout = cacheTimeout;
  }
  
  async getOrganization(organizationId, forceRefresh = false) {
    const cacheKey = `org_${organizationId}`;
    const now = Date.now();
    
    // 캐시 확인
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      
      if (now - timestamp < this.cacheTimeout) {
        console.log(`📋 캐시에서 조회: ${data.name}`);
        return data;
      }
    }
    
    try {
      // API에서 최신 데이터 조회
      const organization = await getOrganizationById(this.apiUrl, organizationId);
      
      // 캐시에 저장
      this.cache.set(cacheKey, {
        data: organization,
        timestamp: now
      });
      
      console.log(`🔄 API에서 조회: ${organization.name}`);
      return organization;
      
    } catch (error) {
      // API 실패 시 오래된 캐시라도 반환
      if (this.cache.has(cacheKey)) {
        const { data } = this.cache.get(cacheKey);
        console.log(`⚠️  API 실패, 캐시 데이터 사용: ${data.name}`);
        return data;
      }
      throw error;
    }
  }
  
  async getOrganizationWithReports(organizationId, forceRefresh = false) {
    const cacheKey = `org_reports_${organizationId}`;
    const now = Date.now();
    
    if (!forceRefresh && this.reportCache.has(cacheKey)) {
      const { data, timestamp } = this.reportCache.get(cacheKey);
      
      if (now - timestamp < this.cacheTimeout) {
        console.log(`📊 캐시에서 보고서 포함 조회: ${data.organization.name}`);
        return data;
      }
    }
    
    try {
      const organizationWithReports = await getOrganizationWithReports(this.apiUrl, organizationId);
      
      this.reportCache.set(cacheKey, {
        data: organizationWithReports,
        timestamp: now
      });
      
      return organizationWithReports;
      
    } catch (error) {
      if (this.reportCache.has(cacheKey)) {
        const { data } = this.reportCache.get(cacheKey);
        console.log(`⚠️  API 실패, 캐시 데이터 사용`);
        return data;
      }
      throw error;
    }
  }
  
  clearCache(organizationId = null) {
    if (organizationId) {
      this.cache.delete(`org_${organizationId}`);
      this.reportCache.delete(`org_reports_${organizationId}`);
    } else {
      this.cache.clear();
      this.reportCache.clear();
    }
  }
  
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, { timestamp }] of this.cache) {
      if (now - timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      organizationCache: {
        total: this.cache.size,
        valid: validEntries,
        expired: expiredEntries
      },
      reportCache: {
        total: this.reportCache.size
      }
    };
  }
  
  // 미리 로딩 (프리로딩)
  async preloadOrganizations(organizationIds) {
    console.log(`🔄 ${organizationIds.length}개 기관 프리로딩 시작`);
    
    const promises = organizationIds.map(id => 
      this.getOrganization(id).catch(error => {
        console.warn(`프리로딩 실패 ID ${id}:`, error.message);
        return null;
      })
    );
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r !== null);
    
    console.log(`✅ 프리로딩 완료: ${successful.length}/${organizationIds.length}개`);
    return successful;
  }
}

// 사용 예시
const organizationCache = new OrganizationCache('https://your-domain.com', 3 * 60 * 1000); // 3분 캐시

// 프리로딩
await organizationCache.preloadOrganizations([1, 2, 3, 4, 5]);

// 첫 번째 조회 (캐시에서)
const organization1 = await organizationCache.getOrganization(1);
console.log('첫 번째 조회:', organization1.name);

// 두 번째 조회 (캐시에서)
const organization2 = await organizationCache.getOrganization(1);
console.log('두 번째 조회:', organization2.name);

// 보고서 포함 조회
const orgWithReports = await organizationCache.getOrganizationWithReports(1);
console.log('보고서 수:', orgWithReports.statistics?.totalReports);

// 캐시 통계
console.log('캐시 통계:', organizationCache.getCacheStats());
```

### 6. 기관 상세 정보 표시 UI 헬퍼

```javascript
function displayOrganizationDetails(organizationData, container) {
  if (!container) {
    console.error('컨테이너 엘리먼트를 찾을 수 없습니다.');
    return;
  }
  
  const { organization, statistics, reports } = organizationData;
  
  const html = `
    <div class="organization-details">
      <div class="organization-header">
        <h2 class="organization-name">${organization.name}</h2>
        <span class="organization-id">ID: ${organization.id}</span>
      </div>
      
      ${statistics ? `
        <div class="organization-statistics">
          <h3>통계 정보</h3>
          
          <div class="stats-overview">
            <div class="stat-card">
              <div class="stat-number">${statistics.totalReports}</div>
              <div class="stat-label">총 보고서</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-number">${statistics.averageReportsPerMonth}</div>
              <div class="stat-label">월평균 보고서</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-number">${statistics.categoryDistribution.length}</div>
              <div class="stat-label">참여 카테고리</div>
            </div>
          </div>
          
          <div class="category-distribution">
            <h4>카테고리별 분포</h4>
            <div class="category-chart">
              ${statistics.categoryDistribution.slice(0, 5).map(([category, count]) => `
                <div class="category-item">
                  <span class="category-name">${category}</span>
                  <div class="category-bar">
                    <div class="category-fill" style="width: ${(count / statistics.totalReports * 100)}%"></div>
                  </div>
                  <span class="category-count">${count}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="recent-activity">
            <h4>최근 활동</h4>
            <div class="recent-reports">
              ${reports ? reports.slice(0, 3).map(report => `
                <div class="recent-report">
                  <div class="report-title">${report.title}</div>
                  <div class="report-meta">${report.date} | ${report.category}</div>
                </div>
              `).join('') : '<p>보고서 정보를 불러올 수 없습니다.</p>'}
            </div>
          </div>
          
          ${statistics.topTags && statistics.topTags.length > 0 ? `
            <div class="top-tags">
              <h4>주요 태그</h4>
              <div class="tags">
                ${statistics.topTags.slice(0, 10).map(([tag, count]) => `
                  <span class="tag" title="${count}개 보고서">${tag}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <div class="organization-actions">
        <button onclick="editOrganization(${organization.id})">수정</button>
        <button onclick="viewOrganizationReports(${organization.id})">모든 보고서 보기</button>
        <button onclick="exportOrganizationData(${organization.id})">데이터 내보내기</button>
        <button onclick="deleteOrganization(${organization.id})" class="danger">삭제</button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// 사용 예시
async function showOrganizationDetails(organizationId) {
  try {
    const organizationCache = new OrganizationCache('https://your-domain.com');
    const organizationWithReports = await organizationCache.getOrganizationWithReports(organizationId);
    
    const container = document.getElementById('organizationDetailsContainer');
    displayOrganizationDetails(organizationWithReports, container);
    
  } catch (error) {
    console.error('기관 상세 정보 표시 실패:', error);
    
    // 에러 메시지 표시
    const container = document.getElementById('organizationDetailsContainer');
    container.innerHTML = `
      <div class="error-message">
        <h3>오류 발생</h3>
        <p>${error.message}</p>
        <button onclick="showOrganizationDetails(${organizationId})">다시 시도</button>
      </div>
    `;
  }
}

// 기관 데이터 내보내기
async function exportOrganizationData(organizationId) {
  try {
    const organizationData = await getOrganizationWithReports('https://your-domain.com', organizationId, {
      limit: 10000,
      includeRecentOnly: false,
      includeStats: true
    });
    
    const exportData = {
      organization: organizationData.organization,
      statistics: organizationData.statistics,
      reports: organizationData.reports,
      exportedAt: new Date().toISOString()
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const filename = `organization-${organizationData.organization.name}-${new Date().toISOString().slice(0, 10)}.json`;
    
    // 브라우저에서 다운로드
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`📄 기관 데이터 내보내기 완료: ${filename}`);
    
  } catch (error) {
    console.error('데이터 내보내기 실패:', error);
    alert('데이터 내보내기에 실패했습니다: ' + error.message);
  }
}
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | number | 기관 고유 ID | `1` |
| `name` | string | 기관 이름 | `"ITU"` |

이 API를 통해 특정 기관의 상세 정보를 효율적으로 조회하고 활용할 수 있습니다.