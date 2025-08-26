# 카테고리 수정 API

## 개요

기존 카테고리의 정보를 수정합니다. 카테고리 이름이나 설명을 변경할 수 있습니다.

## 기본 정보

- **HTTP 메서드**: `PUT`
- **엔드포인트**: `/api/categories/{id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
PUT /api/categories/{id}
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 수정할 카테고리 ID | `1` |

### 요청 본문

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `name` | string | ❌ | 새로운 카테고리 이름 | `"국제표준"` |
| `description` | string | ❌ | 새로운 카테고리 설명 | `"국제 표준화기구 관련 보고서"` |

> **주의**: `name`과 `description` 중 최소 하나의 필드는 제공되어야 합니다.

### 요청 예시

```bash
curl -X PUT https://your-domain.com/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "국제표준",
    "description": "국제 표준화기구에서 제정하는 메타버스 관련 표준"
  }'
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "id": 1,
  "name": "국제표준",
  "description": "국제 표준화기구에서 제정하는 메타버스 관련 표준"
}
```

### 에러 응답

#### 잘못된 ID (400)
```json
{
  "message": "Invalid category ID"
}
```

#### 필드 없음 (400)
```json
{
  "message": "At least one field (name or description) must be provided"
}
```

#### 중복된 카테고리명 (409)
```json
{
  "message": "Category name already exists"
}
```

#### 카테고리 없음 (404)
```json
{
  "message": "Category not found"
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
  "message": "Failed to update category"
}
```

## 실용적인 사용 예시

### 1. JavaScript로 카테고리 수정

```javascript
async function updateCategory(apiUrl, token, categoryId, updates) {
  try {
    // 입력 검증
    if (!updates.name && !updates.description) {
      throw new Error('이름 또는 설명 중 하나 이상은 제공되어야 합니다.');
    }

    const response = await fetch(`${apiUrl}/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('카테고리를 찾을 수 없습니다.');
      }
      if (response.status === 409) {
        throw new Error('이미 존재하는 카테고리명입니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      if (response.status === 400) {
        throw new Error('잘못된 요청입니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedCategory = await response.json();
    return updatedCategory;
  } catch (error) {
    console.error('카테고리 수정 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const updatedCategory = await updateCategory('https://your-domain.com', 'YOUR_JWT_TOKEN', 1, {
    name: '국제표준',
    description: '국제 표준화기구에서 제정하는 메타버스 관련 표준'
  });
  console.log('✅ 카테고리 수정 성공:', updatedCategory);
} catch (error) {
  console.error('❌ 수정 실패:', error.message);
}
```

### 2. 안전한 카테고리 수정

```javascript
async function safeUpdateCategory(apiUrl, token, categoryId, updates) {
  try {
    // 1. 기존 카테고리 정보 조회
    console.log(`🔍 카테고리 ID ${categoryId} 현재 정보 조회 중...`);
    const currentCategory = await fetch(`${apiUrl}/api/categories/${categoryId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    console.log('📋 현재 카테고리 정보:');
    console.log(`  이름: ${currentCategory.name}`);
    console.log(`  설명: ${currentCategory.description}`);

    // 2. 변경사항 확인
    const changes = {};
    if (updates.name && updates.name !== currentCategory.name) {
      changes.name = { from: currentCategory.name, to: updates.name };
    }
    if (updates.description && updates.description !== currentCategory.description) {
      changes.description = { from: currentCategory.description, to: updates.description };
    }

    if (Object.keys(changes).length === 0) {
      console.log('ℹ️  변경사항이 없습니다.');
      return { success: true, category: currentCategory, noChanges: true };
    }

    console.log('📝 변경사항:');
    Object.entries(changes).forEach(([field, change]) => {
      console.log(`  ${field}: "${change.from}" → "${change.to}"`);
    });

    // 3. 이름 중복 확인 (이름 변경 시)
    if (updates.name) {
      const allCategories = await fetch(`${apiUrl}/api/categories`).then(r => r.json());
      const isDuplicate = allCategories.some(cat => 
        cat.id !== categoryId && cat.name.toLowerCase() === updates.name.toLowerCase()
      );

      if (isDuplicate) {
        throw new Error(`"${updates.name}"은 이미 존재하는 카테고리명입니다.`);
      }
    }

    // 4. 실제 수정 실행
    console.log('🔄 카테고리 수정 중...');
    const updatedCategory = await updateCategory(apiUrl, token, categoryId, updates);

    console.log('✅ 카테고리 수정 완료');
    return {
      success: true,
      category: updatedCategory,
      changes,
      previousCategory: currentCategory
    };

  } catch (error) {
    console.error('❌ 안전 수정 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 사용 예시
const result = await safeUpdateCategory('https://your-domain.com', 'YOUR_JWT_TOKEN', 1, {
  name: '국제표준',
  description: '국제 표준화기구에서 제정하는 메타버스 관련 표준'
});

if (result.success && !result.noChanges) {
  console.log('변경된 카테고리:', result.category.name);
}
```

### 3. 일괄 카테고리 수정

```javascript
async function bulkUpdateCategories(apiUrl, token, updates, options = {}) {
  const { 
    batchSize = 5, 
    delay = 1000,
    safeMode = true 
  } = options;
  
  const results = [];
  
  console.log(`📦 ${updates.length}개 카테고리 일괄 수정 시작`);
  
  // 배치 단위로 처리
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    console.log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (const updateData of batch) {
      const { categoryId, ...updateFields } = updateData;
      
      try {
        let result;
        if (safeMode) {
          result = await safeUpdateCategory(apiUrl, token, categoryId, updateFields);
        } else {
          const updatedCategory = await updateCategory(apiUrl, token, categoryId, updateFields);
          result = { success: true, category: updatedCategory };
        }
        
        if (result.success) {
          if (result.noChanges) {
            console.log(`  ➡️  변경사항 없음: ID ${categoryId}`);
          } else {
            console.log(`  ✅ 수정 완료: ${result.category.name} (ID: ${categoryId})`);
          }
        }
        
        results.push({ ...result, categoryId });

      } catch (error) {
        results.push({
          success: false,
          categoryId,
          error: error.message
        });
        console.log(`  ❌ 수정 실패: ID ${categoryId} - ${error.message}`);
      }

      // 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 배치 간 지연
    if (i + batchSize < updates.length) {
      console.log(`⏳ ${delay}ms 대기 중...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 결과 요약
  const successful = results.filter(r => r.success && !r.noChanges);
  const noChanges = results.filter(r => r.noChanges);
  const failed = results.filter(r => !r.success);

  console.log(`\n📊 일괄 수정 완료`);
  console.log(`✅ 성공: ${successful.length}개`);
  console.log(`➡️  변경없음: ${noChanges.length}개`);
  console.log(`❌ 실패: ${failed.length}개`);

  return { 
    results, 
    summary: { 
      successful: successful.length, 
      noChanges: noChanges.length, 
      failed: failed.length 
    } 
  };
}

// 사용 예시
const categoriesToUpdate = [
  {
    categoryId: 1,
    name: '국제표준',
    description: '국제 표준화기구 관련 보고서'
  },
  {
    categoryId: 2,
    name: '국내정책',
    description: '한국 정부의 메타버스 정책 관련 보고서'
  },
  {
    categoryId: 3,
    description: '최신 기술 동향 및 발전 현황 분석' // 이름은 변경하지 않고 설명만 수정
  }
];

const bulkResult = await bulkUpdateCategories(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  categoriesToUpdate,
  {
    batchSize: 2,
    delay: 1500,
    safeMode: true
  }
);
```

### 4. CSV 데이터를 이용한 카테고리 업데이트

```javascript
async function updateCategoriesFromCSV(apiUrl, token, csvContent) {
  try {
    // CSV 파싱
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const updates = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length >= 2 && values[0]) {
        const updateData = {
          categoryId: parseInt(values[0])
        };
        
        // 이름 업데이트
        if (values[1]) {
          updateData.name = values[1];
        }
        
        // 설명 업데이트
        if (values[2]) {
          updateData.description = values[2];
        }
        
        updates.push(updateData);
      }
    }

    console.log(`📂 CSV에서 ${updates.length}개 카테고리 업데이트 파싱 완료`);
    
    // 일괄 업데이트 실행
    const result = await bulkUpdateCategories(apiUrl, token, updates, {
      batchSize: 3,
      delay: 1000,
      safeMode: true
    });

    // 결과를 CSV 형태로 저장
    const resultCsvContent = [
      'ID,Name,Description,Status,Error',
      ...result.results.map(r => {
        if (r.success && !r.noChanges) {
          return `${r.categoryId},"${r.category.name}","${r.category.description}","SUCCESS",""`;
        } else if (r.noChanges) {
          return `${r.categoryId},"","","NO_CHANGES",""`;
        } else {
          return `${r.categoryId},"","","FAILED","${r.error}"`;
        }
      })
    ].join('\n');

    // 결과 파일 저장
    const resultFilename = `category-update-result-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    require('fs').writeFileSync(resultFilename, resultCsvContent);
    console.log(`📄 결과 파일 저장: ${resultFilename}`);

    return { result, resultFilename };

  } catch (error) {
    console.error('❌ CSV 업데이트 실패:', error.message);
    throw error;
  }
}

// 사용 예시
const csvContent = `
ID,Name,Description
1,"국제표준","국제 표준화기구에서 제정하는 메타버스 관련 표준"
2,"국내정책","한국 정부의 메타버스 정책 및 규제 관련 보고서"
3,"기술동향","최신 메타버스 기술 동향 및 발전 현황 분석"
4,"시장분석","메타버스 시장 현황 및 예측 분석 보고서"
`;

const updateResult = await updateCategoriesFromCSV(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  csvContent
);
```

### 5. 조건부 카테고리 수정

```javascript
async function updateCategoriesByCondition(apiUrl, token, condition, updates) {
  try {
    // 1. 모든 카테고리 조회
    console.log('🔍 조건에 맞는 카테고리 검색 중...');
    const allCategories = await fetch(`${apiUrl}/api/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    // 2. 조건 필터링
    const categoriesToUpdate = allCategories.filter(category => {
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
      
      return true;
    });

    if (categoriesToUpdate.length === 0) {
      console.log('조건에 맞는 카테고리가 없습니다.');
      return { updated: [], total: 0 };
    }

    console.log(`\n📋 업데이트 예정 카테고리 (${categoriesToUpdate.length}개):`);
    categoriesToUpdate.forEach(category => {
      console.log(`  - ${category.name} (ID: ${category.id})`);
    });

    // 3. 업데이트 데이터 생성
    const updateBatch = categoriesToUpdate.map(category => {
      const updateData = { categoryId: category.id };
      
      // 동적 업데이트 값 계산
      if (updates.nameSuffix) {
        updateData.name = category.name + updates.nameSuffix;
      }
      if (updates.namePrefix) {
        updateData.name = updates.namePrefix + category.name;
      }
      if (updates.name) {
        updateData.name = updates.name;
      }
      if (updates.descriptionSuffix) {
        updateData.description = (category.description || '') + updates.descriptionSuffix;
      }
      if (updates.descriptionPrefix) {
        updateData.description = updates.descriptionPrefix + (category.description || '');
      }
      if (updates.description) {
        updateData.description = updates.description;
      }
      
      return updateData;
    });

    // 4. 일괄 업데이트 실행
    const result = await bulkUpdateCategories(apiUrl, token, updateBatch, {
      safeMode: true
    });

    return {
      updated: result.results.filter(r => r.success),
      failed: result.results.filter(r => !r.success),
      total: categoriesToUpdate.length
    };

  } catch (error) {
    console.error('❌ 조건부 수정 실패:', error.message);
    throw error;
  }
}

// 사용 예시들

// 이름에 "표준"이 포함된 모든 카테고리 설명 업데이트
const result1 = await updateCategoriesByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN',
  { namePattern: '표준' },
  { descriptionSuffix: ' (메타버스 분야 특화)' }
);

// ID가 1~5 범위인 카테고리들의 이름 앞에 접두어 추가
const result2 = await updateCategoriesByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN',
  { idRange: { min: 1, max: 5 } },
  { namePrefix: '메타버스 ' }
);

// 설명이 비어있는 카테고리들에 기본 설명 추가
const result3 = await updateCategoriesByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN',
  { descriptionPattern: '^$' }, // 빈 문자열 매칭
  { description: '메타버스 관련 보고서 카테고리' }
);
```

### 6. 백업과 롤백 기능

```javascript
class CategoryUpdateManager {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.backups = [];
  }
  
  async updateWithBackup(categoryId, updates) {
    try {
      // 1. 백업 생성
      const originalCategory = await fetch(`${this.apiUrl}/api/categories/${categoryId}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }).then(r => r.json());
      
      const backup = {
        id: Date.now(),
        categoryId,
        original: originalCategory,
        timestamp: new Date().toISOString(),
        updates
      };
      
      // 2. 업데이트 실행
      const updatedCategory = await updateCategory(this.apiUrl, this.token, categoryId, updates);
      
      // 3. 백업 저장
      backup.updated = updatedCategory;
      this.backups.push(backup);
      
      console.log(`💾 백업 생성: ${originalCategory.name} → ${updatedCategory.name}`);
      return { success: true, category: updatedCategory, backupId: backup.id };
      
    } catch (error) {
      console.error('❌ 백업 업데이트 실패:', error);
      throw error;
    }
  }
  
  async rollback(backupId) {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      throw new Error('백업을 찾을 수 없습니다.');
    }
    
    try {
      // 원본 데이터로 복원
      const { id, ...originalData } = backup.original;
      const restoredCategory = await updateCategory(this.apiUrl, this.token, backup.categoryId, originalData);
      
      console.log(`♻️  롤백 완료: ${backup.updated.name} → ${backup.original.name}`);
      return { success: true, category: restoredCategory };
      
    } catch (error) {
      console.error('❌ 롤백 실패:', error);
      throw error;
    }
  }
  
  getBackups() {
    return this.backups.map(backup => ({
      id: backup.id,
      categoryId: backup.categoryId,
      timestamp: backup.timestamp,
      changes: {
        name: { from: backup.original.name, to: backup.updated.name },
        description: { from: backup.original.description, to: backup.updated.description }
      }
    }));
  }
  
  clearBackups() {
    const count = this.backups.length;
    this.backups = [];
    console.log(`🗑️  ${count}개 백업 삭제`);
  }
}

// 사용 예시
const updateManager = new CategoryUpdateManager('https://your-domain.com', 'YOUR_JWT_TOKEN');

// 백업과 함께 업데이트
const updateResult = await updateManager.updateWithBackup(1, {
  name: '새로운 카테고리명',
  description: '새로운 설명'
});

// 백업 목록 확인
console.log('백업 목록:', updateManager.getBackups());

// 롤백 실행
if (updateResult.success) {
  await updateManager.rollback(updateResult.backupId);
}
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | number | 카테고리 ID | `1` |
| `name` | string | 수정된 카테고리 이름 | `"국제표준"` |
| `description` | string | 수정된 카테고리 설명 | `"국제 표준화기구 관련 보고서"` |

## 주의사항

- 카테고리 이름 변경 시 이름 중복을 확인해야 합니다
- 이 카테고리를 사용하는 기존 보고서들의 참조는 자동으로 업데이트됩니다
- 중요한 변경사항은 사전에 백업을 생성하는 것을 권장합니다

이 API를 통해 카테고리 정보를 안전하고 효율적으로 관리할 수 있습니다.