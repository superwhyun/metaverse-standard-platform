# 카테고리 삭제 API

## 개요

기존 카테고리를 삭제합니다. 해당 카테고리를 사용하는 보고서가 있는 경우 삭제가 제한될 수 있습니다.

## 기본 정보

- **HTTP 메서드**: `DELETE`
- **엔드포인트**: `/api/categories/{id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
DELETE /api/categories/{id}
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 삭제할 카테고리 ID | `5` |

### 요청 예시

```bash
curl -X DELETE https://your-domain.com/api/categories/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true
}
```

### 에러 응답

#### 잘못된 ID (400)
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

#### 참조 제약 위반 (409)
```json
{
  "message": "Cannot delete category: reports are still using this category"
}
```

#### 인증 오류 (401)
```json
{
  "message": "관리자 권한이 필요합니다."
}
```

#### 서버 오류 (500)
```json
{
  "message": "Failed to delete category"
}
```

## 실용적인 사용 예시

### 1. 기본 카테고리 삭제

```javascript
async function deleteCategory(apiUrl, token, categoryId) {
  try {
    const response = await fetch(`${apiUrl}/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('카테고리를 찾을 수 없습니다.');
      }
      if (response.status === 409) {
        throw new Error('이 카테고리를 사용하는 보고서가 있어 삭제할 수 없습니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      if (response.status === 400) {
        throw new Error('유효하지 않은 카테고리 ID입니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('카테고리 삭제 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const deleted = await deleteCategory('https://your-domain.com', 'YOUR_JWT_TOKEN', 5);
  if (deleted) {
    console.log('✅ 카테고리가 성공적으로 삭제되었습니다.');
  }
} catch (error) {
  console.error('❌ 삭제 실패:', error.message);
}
```

### 2. 안전한 카테고리 삭제

```javascript
async function safeDeleteCategory(apiUrl, token, categoryId) {
  try {
    // 1. 카테고리 정보 조회
    console.log(`🔍 카테고리 ID ${categoryId} 정보 조회 중...`);
    const categoryResponse = await fetch(`${apiUrl}/api/categories/${categoryId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!categoryResponse.ok) {
      if (categoryResponse.status === 404) {
        throw new Error('삭제하려는 카테고리를 찾을 수 없습니다.');
      }
      throw new Error('카테고리 정보 조회에 실패했습니다.');
    }

    const category = await categoryResponse.json();

    // 2. 해당 카테고리를 사용하는 보고서 확인
    console.log('📊 해당 카테고리를 사용하는 보고서 확인 중...');
    const reportsResponse = await fetch(`${apiUrl}/api/reports/search?category=${encodeURIComponent(category.name)}&limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      const relatedReports = reportsData.data || [];

      if (relatedReports.length > 0) {
        console.log(`⚠️  해당 카테고리를 사용하는 ${relatedReports.length}개의 보고서가 있습니다:`);
        relatedReports.slice(0, 5).forEach(report => {
          console.log(`  - ${report.title} (${report.date})`);
        });
        
        if (relatedReports.length > 5) {
          console.log(`  ... 그 외 ${relatedReports.length - 5}개`);
        }
        
        throw new Error(`이 카테고리를 사용하는 ${relatedReports.length}개의 보고서가 있어 삭제할 수 없습니다. 먼저 관련 보고서들을 다른 카테고리로 이동시키거나 삭제해주세요.`);
      }
    }

    // 3. 삭제 정보 표시
    console.log('🗑️  삭제 예정 카테고리 정보:');
    console.log(`  ID: ${category.id}`);
    console.log(`  이름: ${category.name}`);
    console.log(`  설명: ${category.description}`);

    // 4. 실제 삭제 실행
    console.log('⏳ 카테고리 삭제 중...');
    const deleteResponse = await fetch(`${apiUrl}/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!deleteResponse.ok) {
      throw new Error('카테고리 삭제에 실패했습니다.');
    }

    console.log('✅ 카테고리가 성공적으로 삭제되었습니다.');
    return {
      success: true,
      deletedCategory: {
        id: category.id,
        name: category.name,
        description: category.description
      }
    };

  } catch (error) {
    console.error('❌ 안전 삭제 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 사용 예시
const result = await safeDeleteCategory('https://your-domain.com', 'YOUR_JWT_TOKEN', 5);
if (result.success) {
  console.log('삭제된 카테고리:', result.deletedCategory.name);
}
```

### 3. 강제 삭제 (관련 보고서 카테고리 변경 후 삭제)

```javascript
async function forceDeleteCategory(apiUrl, token, categoryId, replacementCategoryId) {
  try {
    // 1. 대상 및 대체 카테고리 정보 조회
    const [targetCategory, replacementCategory] = await Promise.all([
      fetch(`${apiUrl}/api/categories/${categoryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${apiUrl}/api/categories/${replacementCategoryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ]);

    console.log(`🔄 "${targetCategory.name}" → "${replacementCategory.name}" 카테고리 이동 및 삭제`);

    // 2. 관련 보고서 조회
    const reportsResponse = await fetch(`${apiUrl}/api/reports/search?category=${encodeURIComponent(targetCategory.name)}&limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let relatedReports = [];
    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      relatedReports = reportsData.data || [];
    }

    console.log(`📊 이동할 보고서: ${relatedReports.length}개`);

    // 3. 보고서 카테고리 일괄 변경
    if (relatedReports.length > 0) {
      const updatePromises = relatedReports.map(report => 
        fetch(`${apiUrl}/api/reports/${report.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...report,
            category: replacementCategory.name
          })
        })
      );

      const updateResults = await Promise.allSettled(updatePromises);
      const successCount = updateResults.filter(r => r.status === 'fulfilled').length;
      const failureCount = updateResults.length - successCount;

      console.log(`📝 보고서 카테고리 변경: ${successCount}개 성공, ${failureCount}개 실패`);

      if (failureCount > 0) {
        console.warn(`⚠️  ${failureCount}개 보고서의 카테고리 변경에 실패했습니다.`);
      }
    }

    // 4. 카테고리 삭제
    const deleteResult = await safeDeleteCategory(apiUrl, token, categoryId);
    
    return {
      ...deleteResult,
      movedReports: relatedReports.length,
      targetCategory: targetCategory.name,
      replacementCategory: replacementCategory.name
    };

  } catch (error) {
    console.error('❌ 강제 삭제 실패:', error);
    throw error;
  }
}

// 사용 예시
const forceResult = await forceDeleteCategory(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  5, // 삭제할 카테고리 ID
  1  // 대체 카테고리 ID
);

if (forceResult.success) {
  console.log(`✅ "${forceResult.targetCategory}" 카테고리 삭제 완료`);
  console.log(`📊 ${forceResult.movedReports}개 보고서를 "${forceResult.replacementCategory}"로 이동`);
}
```

### 4. 일괄 카테고리 삭제

```javascript
async function bulkDeleteCategories(apiUrl, token, categoryIds, options = {}) {
  const { 
    batchSize = 3, 
    delay = 1500,
    safeMode = true,
    createBackup = false 
  } = options;
  
  const results = [];
  const backup = [];

  console.log(`🗑️  ${categoryIds.length}개 카테고리 일괄 삭제 시작`);
  console.log(`배치 크기: ${batchSize}, 지연시간: ${delay}ms, 안전모드: ${safeMode}`);

  // 배치 단위로 처리
  for (let i = 0; i < categoryIds.length; i += batchSize) {
    const batch = categoryIds.slice(i, i + batchSize);
    console.log(`\n📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (const categoryId of batch) {
      try {
        let categoryInfo = null;

        // 백업 생성 또는 안전모드
        if (safeMode || createBackup) {
          const categoryResponse = await fetch(`${apiUrl}/api/categories/${categoryId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (categoryResponse.ok) {
            categoryInfo = await categoryResponse.json();
            
            if (createBackup) {
              backup.push(categoryInfo);
            }
          }
        }

        // 삭제 실행
        let deleteResult;
        if (safeMode) {
          deleteResult = await safeDeleteCategory(apiUrl, token, categoryId);
        } else {
          const deleted = await deleteCategory(apiUrl, token, categoryId);
          deleteResult = { success: deleted };
        }

        if (deleteResult.success) {
          results.push({
            success: true,
            id: categoryId,
            name: categoryInfo?.name || `ID ${categoryId}`,
            deletedAt: new Date().toISOString()
          });
          console.log(`  ✅ 삭제 성공: ${categoryInfo?.name || `ID ${categoryId}`}`);
        } else {
          results.push({
            success: false,
            id: categoryId,
            error: deleteResult.error
          });
          console.log(`  ❌ 삭제 실패: ID ${categoryId} - ${deleteResult.error}`);
        }

        // 요청 간 지연
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.push({
          success: false,
          id: categoryId,
          error: error.message
        });
        console.log(`  ❌ 오류: ID ${categoryId} - ${error.message}`);
      }
    }

    // 배치 간 지연
    if (i + batchSize < categoryIds.length) {
      console.log(`⏳ ${delay}ms 대기 중...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 결과 요약
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📊 일괄 삭제 완료`);
  console.log(`✅ 성공: ${successful.length}개`);
  console.log(`❌ 실패: ${failed.length}개`);

  // 백업 파일 저장
  if (createBackup && backup.length > 0) {
    const backupFilename = `deleted-categories-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    require('fs').writeFileSync(backupFilename, JSON.stringify(backup, null, 2));
    console.log(`💾 백업 파일 생성: ${backupFilename}`);
  }

  return { results, backup, summary: { successful: successful.length, failed: failed.length } };
}

// 사용 예시
const categoryIdsToDelete = [5, 6, 7, 8];

const deleteResult = await bulkDeleteCategories(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  categoryIdsToDelete,
  {
    batchSize: 2,
    delay: 2000,
    safeMode: true,
    createBackup: true
  }
);

console.log('삭제 요약:', deleteResult.summary);
```

### 5. 조건부 카테고리 삭제

```javascript
async function deleteCategoriesByCondition(apiUrl, token, condition, options = {}) {
  const { safeMode = true, createBackup = true } = options;

  try {
    // 1. 모든 카테고리 조회
    console.log('🔍 조건에 맞는 카테고리 검색 중...');
    const categoriesResponse = await fetch(`${apiUrl}/api/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!categoriesResponse.ok) {
      throw new Error('카테고리 목록 조회 실패');
    }

    const allCategories = await categoriesResponse.json();

    // 2. 조건 필터링
    const toDelete = allCategories.filter(category => {
      // 이름 패턴 매칭
      if (condition.namePattern) {
        const regex = new RegExp(condition.namePattern, 'i');
        if (!regex.test(category.name)) return false;
      }
      
      // 설명 패턴 매칭
      if (condition.descriptionPattern) {
        const regex = new RegExp(condition.descriptionPattern, 'i');
        if (!category.description || !regex.test(category.description)) return false;
      }
      
      // ID 범위
      if (condition.idRange) {
        if (category.id < condition.idRange.min || category.id > condition.idRange.max) return false;
      }
      
      // 생성 날짜 범위 (API에서 지원하는 경우)
      if (condition.createdDateRange && category.createdAt) {
        const categoryDate = new Date(category.createdAt);
        const startDate = new Date(condition.createdDateRange.start);
        const endDate = new Date(condition.createdDateRange.end);
        if (categoryDate < startDate || categoryDate > endDate) return false;
      }
      
      return true;
    });

    if (toDelete.length === 0) {
      console.log('조건에 맞는 카테고리가 없습니다.');
      return { deleted: [], total: 0 };
    }

    // 3. 삭제 예정 목록 표시
    console.log(`\n📋 삭제 예정 카테고리 (${toDelete.length}개):`);
    toDelete.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.name} (ID: ${category.id}) - ${category.description || '설명없음'}`);
    });

    // 4. 각 카테고리별 사용 현황 확인 (안전모드인 경우)
    if (safeMode) {
      console.log('\n🔍 각 카테고리의 사용 현황 확인 중...');
      
      for (const category of toDelete) {
        const reportsResponse = await fetch(`${apiUrl}/api/reports/search?category=${encodeURIComponent(category.name)}&limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          if (reportsData.total > 0) {
            console.log(`  ⚠️  "${category.name}": ${reportsData.total}개 보고서 사용 중`);
          }
        }

        // API 부하 방지
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 5. 일괄 삭제 실행
    const categoryIds = toDelete.map(c => c.id);
    const deleteResult = await bulkDeleteCategories(apiUrl, token, categoryIds, {
      safeMode,
      createBackup
    });

    return {
      deleted: deleteResult.results.filter(r => r.success),
      failed: deleteResult.results.filter(r => !r.success),
      total: toDelete.length,
      backup: deleteResult.backup
    };

  } catch (error) {
    console.error('❌ 조건부 삭제 실패:', error.message);
    throw error;
  }
}

// 사용 예시들

// 이름에 "테스트"가 포함된 카테고리 삭제
const result1 = await deleteCategoriesByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { namePattern: '테스트' },
  { safeMode: true, createBackup: true }
);

// ID가 10 이상인 카테고리 삭제
const result2 = await deleteCategoriesByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { idRange: { min: 10, max: 999 } },
  { safeMode: true }
);

// 설명이 비어있는 카테고리 삭제
const result3 = await deleteCategoriesByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { descriptionPattern: '^$' } // 빈 문자열 또는 null
);
```

### 6. 카테고리 삭제 전 의존성 분석

```javascript
async function analyzeCategoryDependencies(apiUrl, token, categoryIds) {
  const analysis = [];

  console.log(`🔍 ${categoryIds.length}개 카테고리 의존성 분석 시작`);

  for (const categoryId of categoryIds) {
    try {
      // 카테고리 정보 조회
      const category = await fetch(`${apiUrl}/api/categories/${categoryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());

      // 관련 보고서 조회
      const reportsResponse = await fetch(`${apiUrl}/api/reports/search?category=${encodeURIComponent(category.name)}&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let reports = [];
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        reports = reportsData.data || [];
      }

      // 기관별 분포
      const organizationDistribution = {};
      reports.forEach(report => {
        organizationDistribution[report.organization] = 
          (organizationDistribution[report.organization] || 0) + 1;
      });

      // 날짜 범위
      const dates = reports.map(r => new Date(r.date)).sort((a, b) => a - b);
      const dateRange = dates.length > 0 ? {
        earliest: dates[0].toISOString().slice(0, 10),
        latest: dates[dates.length - 1].toISOString().slice(0, 10)
      } : null;

      analysis.push({
        category: {
          id: category.id,
          name: category.name,
          description: category.description
        },
        dependencies: {
          reportsCount: reports.length,
          canDelete: reports.length === 0,
          organizationDistribution: Object.entries(organizationDistribution)
            .sort(([,a], [,b]) => b - a),
          dateRange,
          recentReports: reports
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map(r => ({ id: r.id, title: r.title, date: r.date }))
        }
      });

      console.log(`  📊 ${category.name}: ${reports.length}개 보고서`);

    } catch (error) {
      analysis.push({
        category: { id: categoryId },
        error: error.message,
        dependencies: { canDelete: false }
      });
      console.log(`  ❌ ID ${categoryId}: ${error.message}`);
    }

    // API 부하 방지
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 분석 요약
  const deletable = analysis.filter(a => a.dependencies?.canDelete);
  const nonDeletable = analysis.filter(a => !a.dependencies?.canDelete);

  console.log(`\n📊 의존성 분석 완료:`);
  console.log(`✅ 삭제 가능: ${deletable.length}개`);
  console.log(`❌ 삭제 불가: ${nonDeletable.length}개`);

  if (nonDeletable.length > 0) {
    console.log(`\n⚠️  삭제 불가 카테고리:`);
    nonDeletable.forEach(item => {
      if (item.error) {
        console.log(`  - ID ${item.category.id}: ${item.error}`);
      } else {
        console.log(`  - ${item.category.name}: ${item.dependencies.reportsCount}개 보고서 사용 중`);
      }
    });
  }

  return {
    analysis,
    summary: {
      total: categoryIds.length,
      deletable: deletable.length,
      nonDeletable: nonDeletable.length
    },
    recommendations: {
      safeDeletion: deletable.map(a => a.category.id),
      requiresAction: nonDeletable.map(a => ({
        categoryId: a.category.id,
        categoryName: a.category.name,
        reportsCount: a.dependencies?.reportsCount || 0,
        error: a.error
      }))
    }
  };
}

// 사용 예시
const dependencyAnalysis = await analyzeCategoryDependencies(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  [1, 2, 3, 4, 5]
);

console.log('분석 결과:', dependencyAnalysis.summary);
console.log('안전 삭제 가능:', dependencyAnalysis.recommendations.safeDeletion);
console.log('조치 필요:', dependencyAnalysis.recommendations.requiresAction);

// 안전한 카테고리만 삭제 실행
if (dependencyAnalysis.recommendations.safeDeletion.length > 0) {
  const safeDeleteResult = await bulkDeleteCategories(
    'https://your-domain.com', 
    'YOUR_JWT_TOKEN', 
    dependencyAnalysis.recommendations.safeDeletion,
    { safeMode: false, createBackup: true } // 이미 분석했으므로 safeMode 불필요
  );
  console.log('안전 삭제 완료:', safeDeleteResult.summary);
}
```

## ⚠️ 중요 주의사항

### 데이터 무결성
1. **참조 제약**: 해당 카테고리를 사용하는 보고서가 있으면 삭제할 수 없습니다
2. **의존성 확인**: 삭제 전 반드시 관련 보고서 존재 여부를 확인하세요
3. **백업 생성**: 중요한 카테고리 삭제 전 백업을 생성하세요

### 권한 관리
- 카테고리 삭제는 관리자 권한이 필요합니다
- 시스템 핵심 카테고리는 삭제하지 마세요

### 복구 불가
- 삭제된 카테고리는 복구할 수 없습니다
- 안전 모드를 사용하여 신중하게 삭제하세요

이 API를 통해 카테고리를 안전하고 효율적으로 관리할 수 있습니다.