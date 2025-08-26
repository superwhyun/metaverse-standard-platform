# 기관 목록 조회 API

## 개요

시스템에 등록된 모든 기관 목록을 조회합니다. 보고서 등록 시 사용할 수 있는 기관들을 확인할 수 있습니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/organizations`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

```http
GET /api/organizations
```

## 응답 형식

### 성공 응답 (200)

```json
[
  {
    "id": 1,
    "name": "ITU"
  },
  {
    "id": 2,
    "name": "ISO"
  },
  {
    "id": 3,
    "name": "IEEE"
  },
  {
    "id": 4,
    "name": "ETRI"
  },
  {
    "id": 5,
    "name": "NIST"
  }
]
```

### 에러 응답 (500)

```json
{
  "message": "Failed to fetch organizations"
}
```

## 실용적인 사용 예시

### 1. 기관 목록 조회

```javascript
async function getOrganizations(apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/api/organizations`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const organizations = await response.json();
    return organizations;
  } catch (error) {
    console.error('기관 목록 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
const organizations = await getOrganizations('https://your-domain.com');
console.log('등록된 기관:', organizations.map(org => org.name));
```

### 2. 기관 선택 UI 생성

```javascript
async function createOrganizationSelect(apiUrl, selectElementId) {
  try {
    const organizations = await getOrganizations(apiUrl);
    const selectElement = document.getElementById(selectElementId);
    
    // 기본 옵션 추가
    selectElement.innerHTML = '<option value="">기관을 선택하세요</option>';
    
    // 기관 옵션들 추가 (알파벳 순으로 정렬)
    organizations
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(organization => {
        const option = document.createElement('option');
        option.value = organization.name;
        option.textContent = organization.name;
        selectElement.appendChild(option);
      });
    
    console.log(`${organizations.length}개 기관이 로드되었습니다.`);
    return organizations;
    
  } catch (error) {
    console.error('기관 UI 생성 실패:', error);
    // 에러 시 기본 기관들 표시
    const selectElement = document.getElementById(selectElementId);
    selectElement.innerHTML = `
      <option value="">기관 로딩 실패</option>
      <option value="ITU">ITU</option>
      <option value="ISO">ISO</option>
      <option value="IEEE">IEEE</option>
    `;
  }
}

// HTML에서 사용
// <select id="organizationSelect"></select>
// createOrganizationSelect('https://your-domain.com', 'organizationSelect');
```

### 3. 기관별 통계 분석

```javascript
async function analyzeOrganizationsUsage(apiUrl) {
  try {
    // 기관 목록과 모든 보고서 조회
    const [organizations, reportsResponse] = await Promise.all([
      getOrganizations(apiUrl),
      fetch(`${apiUrl}/api/reports?limit=10000`).then(r => r.json())
    ]);
    
    const reports = reportsResponse.data || [];
    
    // 기관별 사용 통계
    const organizationStats = organizations.map(organization => {
      const orgReports = reports.filter(report => 
        report.organization === organization.name
      );
      
      // 최근 보고서 찾기
      const recentReports = orgReports
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
      
      // 카테고리별 분포
      const categoryDistribution = {};
      orgReports.forEach(report => {
        categoryDistribution[report.category] = 
          (categoryDistribution[report.category] || 0) + 1;
      });
      
      // 월별 보고서 수 계산
      const monthlyReports = {};
      orgReports.forEach(report => {
        const month = report.date.substring(0, 7); // YYYY-MM 형식
        monthlyReports[month] = (monthlyReports[month] || 0) + 1;
      });
      
      return {
        id: organization.id,
        name: organization.name,
        totalReports: orgReports.length,
        percentage: ((orgReports.length / reports.length) * 100).toFixed(1),
        recentReports: recentReports.map(r => ({
          title: r.title,
          date: r.date,
          category: r.category
        })),
        categoryDistribution: Object.entries(categoryDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        monthlyReports: Object.entries(monthlyReports)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 6), // 최근 6개월
        avgReportsPerMonth: calculateMonthlyAverage(orgReports),
        isActive: orgReports.length > 0 && hasRecentActivity(orgReports, 90) // 90일 이내 활동
      };
    });
    
    // 사용률순으로 정렬
    organizationStats.sort((a, b) => b.totalReports - a.totalReports);
    
    return {
      totalOrganizations: organizations.length,
      totalReports: reports.length,
      organizationStats,
      activeOrganizations: organizationStats.filter(org => org.isActive),
      topProducers: organizationStats.slice(0, 5),
      inactiveOrganizations: organizationStats.filter(org => !org.isActive)
    };
    
  } catch (error) {
    console.error('기관 분석 실패:', error);
    throw error;
  }
}

function calculateMonthlyAverage(reports) {
  if (reports.length === 0) return 0;
  
  const dates = reports.map(r => new Date(r.date));
  const oldest = new Date(Math.min(...dates));
  const newest = new Date(Math.max(...dates));
  
  const monthsDiff = (newest.getFullYear() - oldest.getFullYear()) * 12 + 
                     (newest.getMonth() - oldest.getMonth()) + 1;
  
  return (reports.length / monthsDiff).toFixed(1);
}

function hasRecentActivity(reports, days) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return reports.some(report => new Date(report.date) >= cutoffDate);
}

// 사용 예시
const analysis = await analyzeOrganizationsUsage('https://your-domain.com');
console.log('기관 분석 결과:');
console.log(`총 ${analysis.totalOrganizations}개 기관, ${analysis.totalReports}개 보고서`);
console.log(`활성 기관: ${analysis.activeOrganizations.length}개`);
console.log(`비활성 기관: ${analysis.inactiveOrganizations.length}개`);

console.log('\n상위 5개 기관:');
analysis.topProducers.forEach((org, index) => {
  console.log(`${index + 1}. ${org.name}: ${org.totalReports}개 (${org.percentage}%)`);
  console.log(`   월평균: ${org.avgReportsPerMonth}개`);
  console.log(`   주요 카테고리: ${org.categoryDistribution.slice(0, 2).map(([cat, count]) => `${cat}(${count})`).join(', ')}`);
});
```

### 4. 기관 유효성 검증

```javascript
class OrganizationValidator {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.organizations = null;
    this.lastFetched = null;
  }
  
  async loadOrganizations() {
    // 5분마다 새로고침
    const now = Date.now();
    if (!this.organizations || !this.lastFetched || (now - this.lastFetched > 5 * 60 * 1000)) {
      this.organizations = await getOrganizations(this.apiUrl);
      this.lastFetched = now;
    }
    return this.organizations;
  }
  
  async validateOrganization(organizationName) {
    const organizations = await this.loadOrganizations();
    const validOrganization = organizations.find(org => org.name === organizationName);
    
    return {
      isValid: !!validOrganization,
      organization: validOrganization,
      suggestions: validOrganization ? [] : this.getSuggestions(organizationName, organizations)
    };
  }
  
  getSuggestions(input, organizations) {
    const suggestions = organizations.filter(organization => {
      const name = organization.name.toLowerCase();
      const inputLower = input.toLowerCase();
      
      // 부분 일치 또는 유사도 체크
      return name.includes(inputLower) || 
             inputLower.includes(name) || 
             this.calculateSimilarity(name, inputLower) > 0.6;
    });
    
    return suggestions.slice(0, 3);
  }
  
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  async validateReportData(reportData) {
    const validation = await this.validateOrganization(reportData.organization);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        field: 'organization',
        error: `"${reportData.organization}"는 유효하지 않은 기관명입니다.`,
        suggestions: validation.suggestions.map(s => s.name)
      };
    }
    
    return { isValid: true };
  }
}

// 사용 예시
const validator = new OrganizationValidator('https://your-domain.com');

// 단일 기관 검증
const result = await validator.validateOrganization('ITTU'); // 오타가 있는 기관명
if (!result.isValid) {
  console.log('유효하지 않은 기관명');
  console.log('제안:', result.suggestions.map(s => s.name));
}

// 보고서 데이터 검증
const reportValidation = await validator.validateReportData({
  title: '테스트 보고서',
  organization: 'ITTU', // 잘못된 기관명
  category: '표준'
});

if (!reportValidation.isValid) {
  console.log('검증 실패:', reportValidation.error);
  console.log('제안:', reportValidation.suggestions);
}
```

### 5. 기관 기반 필터링 UI

```javascript
class OrganizationFilter {
  constructor(apiUrl, containerId) {
    this.apiUrl = apiUrl;
    this.containerId = containerId;
    this.selectedOrganizations = new Set();
    this.onFilterChange = null;
  }
  
  async render() {
    try {
      const organizations = await getOrganizations(this.apiUrl);
      const container = document.getElementById(this.containerId);
      
      // 기관을 알파벳 순으로 정렬
      const sortedOrganizations = organizations.sort((a, b) => a.name.localeCompare(b.name));
      
      container.innerHTML = `
        <div class="organization-filter">
          <h4>기관 필터</h4>
          <div class="filter-search">
            <input type="text" id="orgSearch" placeholder="기관 검색..." />
          </div>
          <div class="organization-options">
            <label class="organization-option">
              <input type="checkbox" value="" id="organization-all" checked>
              <span>전체 (${organizations.length})</span>
            </label>
            ${sortedOrganizations.map(organization => `
              <label class="organization-option" data-name="${organization.name.toLowerCase()}">
                <input type="checkbox" value="${organization.name}" class="organization-checkbox">
                <span>${organization.name}</span>
              </label>
            `).join('')}
          </div>
          <div class="filter-actions">
            <button id="organization-clear">전체 해제</button>
            <button id="organization-apply">필터 적용</button>
          </div>
          <div class="selected-count"></div>
        </div>
      `;
      
      this.attachEventListeners();
      
    } catch (error) {
      console.error('기관 필터 렌더링 실패:', error);
    }
  }
  
  attachEventListeners() {
    const container = document.getElementById(this.containerId);
    
    // 검색 기능
    const searchInput = container.querySelector('#orgSearch');
    searchInput.addEventListener('input', (e) => {
      this.filterOptions(e.target.value);
    });
    
    // 전체 선택/해제
    const allCheckbox = container.querySelector('#organization-all');
    allCheckbox.addEventListener('change', (e) => {
      const checkboxes = container.querySelectorAll('.organization-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
      });
      this.updateSelectedOrganizations();
    });
    
    // 개별 기관 선택
    const checkboxes = container.querySelectorAll('.organization-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectedOrganizations();
      });
    });
    
    // 전체 해제 버튼
    const clearButton = container.querySelector('#organization-clear');
    clearButton.addEventListener('click', () => {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
      this.updateSelectedOrganizations();
    });
    
    // 필터 적용 버튼
    const applyButton = container.querySelector('#organization-apply');
    applyButton.addEventListener('click', () => {
      if (this.onFilterChange) {
        this.onFilterChange(Array.from(this.selectedOrganizations));
      }
    });
  }
  
  filterOptions(searchTerm) {
    const container = document.getElementById(this.containerId);
    const options = container.querySelectorAll('.organization-option[data-name]');
    
    const term = searchTerm.toLowerCase();
    
    options.forEach(option => {
      const orgName = option.getAttribute('data-name');
      const shouldShow = orgName.includes(term);
      option.style.display = shouldShow ? 'block' : 'none';
    });
  }
  
  updateSelectedOrganizations() {
    const container = document.getElementById(this.containerId);
    const checkedBoxes = container.querySelectorAll('.organization-checkbox:checked');
    
    this.selectedOrganizations.clear();
    checkedBoxes.forEach(checkbox => {
      this.selectedOrganizations.add(checkbox.value);
    });
    
    // 전체 선택 체크박스 상태 업데이트
    const allCheckbox = container.querySelector('#organization-all');
    const totalCheckboxes = container.querySelectorAll('.organization-checkbox');
    allCheckbox.checked = checkedBoxes.length === totalCheckboxes.length;
    
    // 선택된 기관 수 표시
    const countDisplay = container.querySelector('.selected-count');
    if (countDisplay) {
      countDisplay.textContent = `${checkedBoxes.length}개 선택됨`;
    }
  }
  
  onFilterChanged(callback) {
    this.onFilterChange = callback;
  }
  
  getSelectedOrganizations() {
    return Array.from(this.selectedOrganizations);
  }
  
  setSelectedOrganizations(organizations) {
    this.selectedOrganizations = new Set(organizations);
    
    // UI 업데이트
    const container = document.getElementById(this.containerId);
    const checkboxes = container.querySelectorAll('.organization-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.selectedOrganizations.has(checkbox.value);
    });
    
    this.updateSelectedOrganizations();
  }
}

// 사용 예시
const organizationFilter = new OrganizationFilter('https://your-domain.com', 'orgFilterContainer');

// 렌더링
await organizationFilter.render();

// 필터 변경 이벤트 핸들러
organizationFilter.onFilterChanged((selectedOrganizations) => {
  console.log('선택된 기관:', selectedOrganizations);
  
  // 보고서 목록 필터링
  filterReports(selectedOrganizations);
});

async function filterReports(organizations) {
  if (organizations.length === 0) {
    // 전체 보고서 표시
    const allReports = await fetch('/api/reports').then(r => r.json());
    displayReports(allReports.data);
  } else {
    // 선택된 기관의 보고서만 표시
    const filteredReports = [];
    
    for (const organization of organizations) {
      const orgReports = await fetch(`/api/reports/search?organization=${encodeURIComponent(organization)}`)
        .then(r => r.json());
      filteredReports.push(...orgReports.data);
    }
    
    displayReports(filteredReports);
  }
}
```

### 6. 기관 정보 캐싱과 성능 최적화

```javascript
class OrganizationCache {
  constructor(apiUrl, cacheTimeout = 10 * 60 * 1000) { // 10분 캐시
    this.apiUrl = apiUrl;
    this.cache = null;
    this.lastFetched = null;
    this.cacheTimeout = cacheTimeout;
    this.fetchPromise = null; // 중복 요청 방지
  }
  
  async getOrganizations(forceRefresh = false) {
    const now = Date.now();
    
    // 캐시 확인
    if (!forceRefresh && this.cache && this.lastFetched && (now - this.lastFetched < this.cacheTimeout)) {
      console.log('📋 캐시에서 기관 목록 조회');
      return this.cache;
    }
    
    // 이미 요청이 진행 중인 경우 대기
    if (this.fetchPromise) {
      console.log('🔄 진행 중인 요청 대기');
      return await this.fetchPromise;
    }
    
    try {
      // 새로운 요청 시작
      this.fetchPromise = getOrganizations(this.apiUrl);
      const organizations = await this.fetchPromise;
      
      // 캐시 업데이트
      this.cache = organizations;
      this.lastFetched = now;
      
      console.log(`🔄 API에서 ${organizations.length}개 기관 조회`);
      return organizations;
      
    } catch (error) {
      // API 실패 시 오래된 캐시라도 반환
      if (this.cache) {
        console.log('⚠️  API 실패, 캐시 데이터 사용');
        return this.cache;
      }
      throw error;
    } finally {
      this.fetchPromise = null;
    }
  }
  
  async findOrganization(name) {
    const organizations = await this.getOrganizations();
    return organizations.find(org => org.name === name);
  }
  
  async findOrganizationById(id) {
    const organizations = await this.getOrganizations();
    return organizations.find(org => org.id === id);
  }
  
  async searchOrganizations(query) {
    const organizations = await this.getOrganizations();
    const lowercaseQuery = query.toLowerCase();
    
    return organizations.filter(org =>
      org.name.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  clearCache() {
    this.cache = null;
    this.lastFetched = null;
    console.log('🗑️  기관 캐시 삭제');
  }
  
  getCacheStats() {
    const now = Date.now();
    const isValid = this.cache && this.lastFetched && (now - this.lastFetched < this.cacheTimeout);
    
    return {
      isCached: !!this.cache,
      isValid,
      itemCount: this.cache ? this.cache.length : 0,
      lastFetched: this.lastFetched ? new Date(this.lastFetched).toISOString() : null,
      expiresAt: this.lastFetched ? new Date(this.lastFetched + this.cacheTimeout).toISOString() : null
    };
  }
}

// 사용 예시
const orgCache = new OrganizationCache('https://your-domain.com', 5 * 60 * 1000); // 5분 캐시

// 첫 번째 조회 (API에서)
const organizations1 = await orgCache.getOrganizations();
console.log('첫 번째 조회:', organizations1.length);

// 두 번째 조회 (캐시에서)
const organizations2 = await orgCache.getOrganizations();
console.log('두 번째 조회:', organizations2.length);

// 기관 검색
const searchResults = await orgCache.searchOrganizations('IT');
console.log('검색 결과:', searchResults.map(org => org.name));

// 캐시 통계
console.log('캐시 통계:', orgCache.getCacheStats());
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | number | 기관 고유 ID | `1` |
| `name` | string | 기관 이름 | `"ITU"` |

이 API를 통해 시스템에서 사용할 수 있는 모든 기관을 조회하고 관리할 수 있습니다.