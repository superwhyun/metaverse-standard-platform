# 카테고리 상세 조회 API

## 개요

특정 카테고리의 상세 정보를 조회합니다. 카테고리 ID를 통해 개별 카테고리 정보를 확인할 수 있습니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/categories/{id}`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 조회할 카테고리 ID | `1` |

```http
GET /api/categories/{id}
```

### 요청 예시

```bash
curl https://your-domain.com/api/categories/1
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "id": 1,
  "name": "표준",
  "description": "국제 표준화 관련 보고서"
}
```

### 에러 응답

#### 잘못된 ID 형식 (400)
```json
{
  "message": "Invalid category ID"
}
```

#### 카테고리 없음 (404)
```json
{
  "message": "Category not found"
}
```

#### 서버 오류 (500)
```json
{
  "message": "Failed to fetch category"
}
```

## 실용적인 사용 예시

### 1. 카테고리 상세 조회

```javascript
async function getCategoryById(apiUrl, categoryId) {
  try {
    const response = await fetch(`${apiUrl}/api/categories/${categoryId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('카테고리를 찾을 수 없습니다.');
      }
      if (response.status === 400) {
        throw new Error('유효하지 않은 카테고리 ID입니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const category = await response.json();
    return category;
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const category = await getCategoryById('https://your-domain.com', 1);
  console.log('카테고리 정보:', category);
} catch (error) {
  console.error('조회 실패:', error.message);
}
```

### 2. 카테고리 정보와 관련 보고서 함께 조회

```javascript
async function getCategoryWithReports(apiUrl, categoryId, options = {}) {
  const { limit = 10, includeRecentOnly = true } = options;
  
  try {
    // 카테고리 정보와 관련 보고서를 동시에 조회
    const [category, reportsResponse] = await Promise.all([
      getCategoryById(apiUrl, categoryId),
      fetch(`${apiUrl}/api/reports/search?category=${encodeURIComponent(categoryId)}&limit=${limit}`)
        .then(r => r.json())
    ]);
    
    let reports = reportsResponse.data || [];
    
    // 최근 보고서만 필터링 (옵션)
    if (includeRecentOnly) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      reports = reports.filter(report => 
        new Date(report.date) >= sixMonthsAgo
      );
    }
    
    // 기관별 분포 계산
    const organizationDistribution = {};
    reports.forEach(report => {
      organizationDistribution[report.organization] = 
        (organizationDistribution[report.organization] || 0) + 1;
    });
    
    // 월별 보고서 수 계산
    const monthlyDistribution = {};
    reports.forEach(report => {
      const month = report.date.substring(0, 7); // YYYY-MM 형식
      monthlyDistribution[month] = (monthlyDistribution[month] || 0) + 1;
    });
    
    return {
      category,
      reports,
      statistics: {
        totalReports: reports.length,
        organizationDistribution: Object.entries(organizationDistribution)
          .sort(([,a], [,b]) => b - a),
        monthlyDistribution: Object.entries(monthlyDistribution)
          .sort(([a], [b]) => b.localeCompare(a)),
        mostRecentReport: reports.length > 0 
          ? reports.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
          : null
      }
    };
    
  } catch (error) {
    console.error('카테고리 및 보고서 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
const categoryInfo = await getCategoryWithReports('https://your-domain.com', 1, {
  limit: 20,
  includeRecentOnly: false
});

console.log('카테고리:', categoryInfo.category.name);
console.log('보고서 수:', categoryInfo.statistics.totalReports);
console.log('주요 기관:', categoryInfo.statistics.organizationDistribution.slice(0, 3));
console.log('최근 보고서:', categoryInfo.statistics.mostRecentReport?.title);
```

### 3. 여러 카테고리 정보 한번에 조회

```javascript
async function getMultipleCategories(apiUrl, categoryIds, options = {}) {
  const { includeReports = false, batchSize = 5 } = options;
  
  const results = [];
  
  // 배치 단위로 처리하여 API 부하 방지
  for (let i = 0; i < categoryIds.length; i += batchSize) {
    const batch = categoryIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (categoryId) => {
      try {
        if (includeReports) {
          return await getCategoryWithReports(apiUrl, categoryId);
        } else {
          const category = await getCategoryById(apiUrl, categoryId);
          return { category };
        }
      } catch (error) {
        return {
          categoryId,
          error: error.message,
          success: false
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 배치 간 지연
    if (i + batchSize < categoryIds.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  return {
    successful,
    failed,
    summary: {
      total: categoryIds.length,
      successful: successful.length,
      failed: failed.length
    }
  };
}

// 사용 예시
const categoryIds = [1, 2, 3, 4, 5];
const multipleCategories = await getMultipleCategories('https://your-domain.com', categoryIds, {
  includeReports: true,
  batchSize: 3
});

console.log(`조회 완료: ${multipleCategories.summary.successful}/${multipleCategories.summary.total}개`);
multipleCategories.successful.forEach(item => {
  console.log(`- ${item.category.name}: ${item.statistics?.totalReports || 0}개 보고서`);
});
```

### 4. 카테고리 존재 여부 확인

```javascript
async function checkCategoryExists(apiUrl, categoryId) {
  try {
    const response = await fetch(`${apiUrl}/api/categories/${categoryId}`, {
      method: 'HEAD' // HEAD 메서드로 헤더만 요청 (데이터는 받지 않음)
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

// HEAD가 지원되지 않는 경우의 대안
async function checkCategoryExistsAlternative(apiUrl, categoryId) {
  try {
    await getCategoryById(apiUrl, categoryId);
    return true;
  } catch (error) {
    return false;
  }
}

// 사용 예시
const exists = await checkCategoryExists('https://your-domain.com', 1);
console.log('카테고리 존재 여부:', exists);

// 여러 카테고리 존재 확인
async function checkMultipleCategoriesExist(apiUrl, categoryIds) {
  const results = await Promise.all(
    categoryIds.map(async (id) => ({
      id,
      exists: await checkCategoryExists(apiUrl, id)
    }))
  );
  
  return results;
}

const existenceCheck = await checkMultipleCategoriesExist('https://your-domain.com', [1, 2, 99, 100]);
console.log('존재 확인 결과:', existenceCheck);
```

### 5. 카테고리 정보 캐싱

```javascript
class CategoryCache {
  constructor(apiUrl, cacheTimeout = 5 * 60 * 1000) { // 5분 캐시
    this.apiUrl = apiUrl;
    this.cache = new Map();
    this.cacheTimeout = cacheTimeout;
  }
  
  async getCategory(categoryId, forceRefresh = false) {
    const cacheKey = `category_${categoryId}`;
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
      const category = await getCategoryById(this.apiUrl, categoryId);
      
      // 캐시에 저장
      this.cache.set(cacheKey, {
        data: category,
        timestamp: now
      });
      
      console.log(`🔄 API에서 조회: ${category.name}`);
      return category;
      
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
  
  async getCategoryWithReports(categoryId, forceRefresh = false) {
    const cacheKey = `category_reports_${categoryId}`;
    const now = Date.now();
    
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      
      if (now - timestamp < this.cacheTimeout) {
        return data;
      }
    }
    
    try {
      const categoryWithReports = await getCategoryWithReports(this.apiUrl, categoryId);
      
      this.cache.set(cacheKey, {
        data: categoryWithReports,
        timestamp: now
      });
      
      return categoryWithReports;
      
    } catch (error) {
      if (this.cache.has(cacheKey)) {
        const { data } = this.cache.get(cacheKey);
        return data;
      }
      throw error;
    }
  }
  
  clearCache(categoryId = null) {
    if (categoryId) {
      this.cache.delete(`category_${categoryId}`);
      this.cache.delete(`category_reports_${categoryId}`);
    } else {
      this.cache.clear();
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
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

// 사용 예시
const categoryCache = new CategoryCache('https://your-domain.com', 3 * 60 * 1000); // 3분 캐시

// 첫 번째 조회 (API에서)
const category1 = await categoryCache.getCategory(1);
console.log('첫 번째 조회:', category1.name);

// 두 번째 조회 (캐시에서)
const category2 = await categoryCache.getCategory(1);
console.log('두 번째 조회:', category2.name);

// 강제 새로고침
const category3 = await categoryCache.getCategory(1, true);
console.log('강제 새로고침:', category3.name);

// 캐시 통계
console.log('캐시 통계:', categoryCache.getCacheStats());
```

### 6. 카테고리 상세 정보 표시 UI 헬퍼

```javascript
function displayCategoryDetails(category, container) {
  if (!container) {
    console.error('컨테이너 엘리먼트를 찾을 수 없습니다.');
    return;
  }
  
  const html = `
    <div class="category-details">
      <div class="category-header">
        <h2 class="category-name">${category.name}</h2>
        <span class="category-id">ID: ${category.id}</span>
      </div>
      
      <div class="category-description">
        <p>${category.description || '설명이 없습니다.'}</p>
      </div>
      
      ${category.statistics ? `
        <div class="category-statistics">
          <h3>통계 정보</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <label>총 보고서 수</label>
              <value>${category.statistics.totalReports}</value>
            </div>
            
            <div class="stat-item">
              <label>최근 보고서</label>
              <value>${category.statistics.mostRecentReport?.title || '없음'}</value>
            </div>
          </div>
          
          <div class="organization-distribution">
            <h4>기관별 분포</h4>
            <ul>
              ${category.statistics.organizationDistribution.slice(0, 5).map(([org, count]) => 
                `<li>${org}: ${count}개</li>`
              ).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      <div class="category-actions">
        <button onclick="editCategory(${category.id})">수정</button>
        <button onclick="viewCategoryReports(${category.id})">보고서 보기</button>
        <button onclick="deleteCategory(${category.id})" class="danger">삭제</button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// 사용 예시
async function showCategoryDetails(categoryId) {
  try {
    const categoryCache = new CategoryCache('https://your-domain.com');
    const categoryWithReports = await categoryCache.getCategoryWithReports(categoryId);
    
    const container = document.getElementById('categoryDetailsContainer');
    displayCategoryDetails(categoryWithReports, container);
    
  } catch (error) {
    console.error('카테고리 상세 정보 표시 실패:', error);
    
    // 에러 메시지 표시
    const container = document.getElementById('categoryDetailsContainer');
    container.innerHTML = `
      <div class="error-message">
        <h3>오류 발생</h3>
        <p>${error.message}</p>
        <button onclick="showCategoryDetails(${categoryId})">다시 시도</button>
      </div>
    `;
  }
}
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | number | 카테고리 고유 ID | `1` |
| `name` | string | 카테고리 이름 | `"표준"` |
| `description` | string | 카테고리 설명 | `"국제 표준화 관련 보고서"` |

이 API를 통해 특정 카테고리의 상세 정보를 효율적으로 조회하고 활용할 수 있습니다.