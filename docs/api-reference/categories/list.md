# 카테고리 목록 조회 API

## 개요

시스템에 등록된 모든 카테고리 목록을 조회합니다. 보고서 등록 시 사용할 수 있는 카테고리들을 확인할 수 있습니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/categories`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

```http
GET /api/categories
```

## 응답 형식

### 성공 응답 (200)

```json
[
  {
    "id": 1,
    "name": "표준",
    "description": "국제 표준화 관련 보고서"
  },
  {
    "id": 2,
    "name": "정책",
    "description": "정부 정책 및 규제 관련 보고서"
  },
  {
    "id": 3,
    "name": "기술동향",
    "description": "최신 기술 동향 및 발전 현황"
  },
  {
    "id": 4,
    "name": "시장동향",
    "description": "시장 분석 및 예측 보고서"
  }
]
```

### 에러 응답 (500)

```json
{
  "message": "Failed to fetch categories"
}
```

## 실용적인 사용 예시

### 1. 카테고리 목록 조회

```javascript
async function getCategories(apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/api/categories`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const categories = await response.json();
    return categories;
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
const categories = await getCategories('https://your-domain.com');
console.log('사용 가능한 카테고리:', categories.map(c => c.name));
```

### 2. 카테고리 선택 UI 생성

```javascript
async function createCategorySelect(apiUrl, selectElementId) {
  try {
    const categories = await getCategories(apiUrl);
    const selectElement = document.getElementById(selectElementId);
    
    // 기본 옵션 추가
    selectElement.innerHTML = '<option value="">카테고리를 선택하세요</option>';
    
    // 카테고리 옵션들 추가
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      option.title = category.description; // 툴팁으로 설명 표시
      selectElement.appendChild(option);
    });
    
    console.log(`${categories.length}개 카테고리가 로드되었습니다.`);
    return categories;
    
  } catch (error) {
    console.error('카테고리 UI 생성 실패:', error);
    // 에러 시 기본 카테고리들 표시
    const selectElement = document.getElementById(selectElementId);
    selectElement.innerHTML = `
      <option value="">카테고리 로딩 실패</option>
      <option value="표준">표준</option>
      <option value="정책">정책</option>
      <option value="기술동향">기술동향</option>
    `;
  }
}

// HTML에서 사용
// <select id="categorySelect"></select>
// createCategorySelect('https://your-domain.com', 'categorySelect');
```

### 3. 카테고리별 통계 분석

```javascript
async function analyzeCategoriesUsage(apiUrl) {
  try {
    // 카테고리 목록과 모든 보고서 조회
    const [categories, reportsResponse] = await Promise.all([
      getCategories(apiUrl),
      fetch(`${apiUrl}/api/reports?limit=10000`).then(r => r.json())
    ]);
    
    const reports = reportsResponse.data || [];
    
    // 카테고리별 사용 통계
    const categoryStats = categories.map(category => {
      const categoryReports = reports.filter(report => 
        report.category === category.name
      );
      
      // 최근 보고서 찾기
      const recentReports = categoryReports
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
      
      // 기관별 분포
      const organizationDistribution = {};
      categoryReports.forEach(report => {
        organizationDistribution[report.organization] = 
          (organizationDistribution[report.organization] || 0) + 1;
      });
      
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        totalReports: categoryReports.length,
        percentage: ((categoryReports.length / reports.length) * 100).toFixed(1),
        recentReports: recentReports.map(r => ({
          title: r.title,
          date: r.date,
          organization: r.organization
        })),
        organizationDistribution: Object.entries(organizationDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        avgReportsPerMonth: calculateMonthlyAverage(categoryReports)
      };
    });
    
    // 사용률순으로 정렬
    categoryStats.sort((a, b) => b.totalReports - a.totalReports);
    
    return {
      totalCategories: categories.length,
      totalReports: reports.length,
      categoryStats,
      mostPopular: categoryStats[0],
      leastUsed: categoryStats[categoryStats.length - 1]
    };
    
  } catch (error) {
    console.error('카테고리 분석 실패:', error);
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

// 사용 예시
const analysis = await analyzeCategoriesUsage('https://your-domain.com');
console.log('카테고리 분석 결과:');
console.log(`총 ${analysis.totalCategories}개 카테고리, ${analysis.totalReports}개 보고서`);
console.log(`가장 인기: ${analysis.mostPopular.name} (${analysis.mostPopular.totalReports}개, ${analysis.mostPopular.percentage}%)`);

analysis.categoryStats.forEach(stat => {
  console.log(`\n📂 ${stat.name}: ${stat.totalReports}개 (${stat.percentage}%)`);
  console.log(`   월평균: ${stat.avgReportsPerMonth}개`);
  console.log(`   주요 기관: ${stat.organizationDistribution.slice(0, 3).map(([org, count]) => `${org}(${count})`).join(', ')}`);
});
```

### 4. 카테고리 유효성 검증

```javascript
class CategoryValidator {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.categories = null;
    this.lastFetched = null;
  }
  
  async loadCategories() {
    // 5분마다 새로고침
    const now = Date.now();
    if (!this.categories || !this.lastFetched || (now - this.lastFetched > 5 * 60 * 1000)) {
      this.categories = await getCategories(this.apiUrl);
      this.lastFetched = now;
    }
    return this.categories;
  }
  
  async validateCategory(categoryName) {
    const categories = await this.loadCategories();
    const validCategory = categories.find(c => c.name === categoryName);
    
    return {
      isValid: !!validCategory,
      category: validCategory,
      suggestions: validCategory ? [] : this.getSuggestions(categoryName, categories)
    };
  }
  
  getSuggestions(input, categories) {
    const suggestions = categories.filter(category => {
      const name = category.name.toLowerCase();
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
    const validation = await this.validateCategory(reportData.category);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        field: 'category',
        error: `"${reportData.category}"는 유효하지 않은 카테고리입니다.`,
        suggestions: validation.suggestions.map(s => s.name)
      };
    }
    
    return { isValid: true };
  }
}

// 사용 예시
const validator = new CategoryValidator('https://your-domain.com');

// 단일 카테고리 검증
const result = await validator.validateCategory('표준화');
if (!result.isValid) {
  console.log('유효하지 않은 카테고리:', result.suggestions);
}

// 보고서 데이터 검증
const reportValidation = await validator.validateReportData({
  title: '테스트 보고서',
  category: '기술표준',  // 잘못된 카테고리
  organization: 'ITU'
});

if (!reportValidation.isValid) {
  console.log('검증 실패:', reportValidation.error);
  console.log('제안:', reportValidation.suggestions);
}
```

### 5. 카테고리 기반 필터링 UI

```javascript
class CategoryFilter {
  constructor(apiUrl, containerId) {
    this.apiUrl = apiUrl;
    this.containerId = containerId;
    this.selectedCategories = new Set();
    this.onFilterChange = null;
  }
  
  async render() {
    try {
      const categories = await getCategories(this.apiUrl);
      const container = document.getElementById(this.containerId);
      
      container.innerHTML = `
        <div class="category-filter">
          <h4>카테고리 필터</h4>
          <div class="category-options">
            <label class="category-option">
              <input type="checkbox" value="" id="category-all" checked>
              <span>전체 (${categories.length})</span>
            </label>
            ${categories.map(category => `
              <label class="category-option">
                <input type="checkbox" value="${category.name}" class="category-checkbox">
                <span>${category.name}</span>
                <small>${category.description}</small>
              </label>
            `).join('')}
          </div>
          <div class="filter-actions">
            <button id="category-clear">전체 해제</button>
            <button id="category-apply">필터 적용</button>
          </div>
        </div>
      `;
      
      this.attachEventListeners();
      
    } catch (error) {
      console.error('카테고리 필터 렌더링 실패:', error);
    }
  }
  
  attachEventListeners() {
    const container = document.getElementById(this.containerId);
    
    // 전체 선택/해제
    const allCheckbox = container.querySelector('#category-all');
    allCheckbox.addEventListener('change', (e) => {
      const checkboxes = container.querySelectorAll('.category-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
      });
      this.updateSelectedCategories();
    });
    
    // 개별 카테고리 선택
    const checkboxes = container.querySelectorAll('.category-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectedCategories();
      });
    });
    
    // 전체 해제 버튼
    const clearButton = container.querySelector('#category-clear');
    clearButton.addEventListener('click', () => {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
      this.updateSelectedCategories();
    });
    
    // 필터 적용 버튼
    const applyButton = container.querySelector('#category-apply');
    applyButton.addEventListener('click', () => {
      if (this.onFilterChange) {
        this.onFilterChange(Array.from(this.selectedCategories));
      }
    });
  }
  
  updateSelectedCategories() {
    const container = document.getElementById(this.containerId);
    const checkedBoxes = container.querySelectorAll('.category-checkbox:checked');
    
    this.selectedCategories.clear();
    checkedBoxes.forEach(checkbox => {
      this.selectedCategories.add(checkbox.value);
    });
    
    // 전체 선택 체크박스 상태 업데이트
    const allCheckbox = container.querySelector('#category-all');
    const totalCheckboxes = container.querySelectorAll('.category-checkbox');
    allCheckbox.checked = checkedBoxes.length === totalCheckboxes.length;
    
    // 선택된 카테고리 수 표시
    const countDisplay = container.querySelector('.selected-count');
    if (countDisplay) {
      countDisplay.textContent = `${checkedBoxes.length}개 선택됨`;
    }
  }
  
  onFilterChanged(callback) {
    this.onFilterChange = callback;
  }
  
  getSelectedCategories() {
    return Array.from(this.selectedCategories);
  }
  
  setSelectedCategories(categories) {
    this.selectedCategories = new Set(categories);
    
    // UI 업데이트
    const container = document.getElementById(this.containerId);
    const checkboxes = container.querySelectorAll('.category-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.selectedCategories.has(checkbox.value);
    });
    
    this.updateSelectedCategories();
  }
}

// 사용 예시
const categoryFilter = new CategoryFilter('https://your-domain.com', 'categoryFilterContainer');

// 렌더링
await categoryFilter.render();

// 필터 변경 이벤트 핸들러
categoryFilter.onFilterChanged((selectedCategories) => {
  console.log('선택된 카테고리:', selectedCategories);
  
  // 보고서 목록 필터링
  filterReports(selectedCategories);
});

async function filterReports(categories) {
  if (categories.length === 0) {
    // 전체 보고서 표시
    const allReports = await fetch('/api/reports').then(r => r.json());
    displayReports(allReports.data);
  } else {
    // 선택된 카테고리의 보고서만 표시
    const filteredReports = [];
    
    for (const category of categories) {
      const categoryReports = await fetch(`/api/reports/search?category=${encodeURIComponent(category)}`)
        .then(r => r.json());
      filteredReports.push(...categoryReports.data);
    }
    
    displayReports(filteredReports);
  }
}
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | number | 카테고리 고유 ID | `1` |
| `name` | string | 카테고리 이름 | `"표준"` |
| `description` | string | 카테고리 설명 | `"국제 표준화 관련 보고서"` |

이 API를 통해 시스템에서 사용할 수 있는 모든 카테고리를 조회하고 관리할 수 있습니다.