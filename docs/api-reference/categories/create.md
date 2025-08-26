# 카테고리 생성 API

## 개요

새로운 카테고리를 생성합니다. 보고서 분류 체계를 확장할 때 사용됩니다.

## 기본 정보

- **HTTP 메서드**: `POST`
- **엔드포인트**: `/api/categories`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
POST /api/categories
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### 요청 본문

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `name` | string | ✅ | 카테고리 이름 (고유값) | `"산업동향"` |
| `description` | string | ❌ | 카테고리 설명 | `"산업 현황 및 동향 분석 보고서"` |

### 요청 예시

```bash
curl -X POST https://your-domain.com/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "산업동향",
    "description": "산업 현황 및 동향 분석 보고서"
  }'
```

## 응답 형식

### 성공 응답 (201)

```json
{
  "id": 5,
  "name": "산업동향",
  "description": "산업 현황 및 동향 분석 보고서"
}
```

### 에러 응답

#### 필수 필드 누락 (400)
```json
{
  "message": "Category name is required"
}
```

#### 중복된 카테고리명 (409)
```json
{
  "message": "Category name already exists"
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
  "message": "Failed to create category"
}
```

## 실용적인 사용 예시

### 1. JavaScript로 카테고리 생성

```javascript
async function createCategory(apiUrl, token, categoryData) {
  try {
    const response = await fetch(`${apiUrl}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(categoryData)
    });

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('이미 존재하는 카테고리명입니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      if (response.status === 400) {
        throw new Error('카테고리명은 필수 항목입니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newCategory = await response.json();
    return newCategory;
  } catch (error) {
    console.error('카테고리 생성 실패:', error);
    throw error;
  }
}

// 사용 예시
const categoryData = {
  name: '산업동향',
  description: '산업 현황 및 동향 분석 보고서'
};

try {
  const newCategory = await createCategory('https://your-domain.com', 'YOUR_JWT_TOKEN', categoryData);
  console.log('✅ 카테고리 생성 성공:', newCategory);
} catch (error) {
  console.error('❌ 생성 실패:', error.message);
}
```

### 2. 카테고리 검증 및 생성

```javascript
async function validateAndCreateCategory(apiUrl, token, categoryData) {
  try {
    // 1. 입력 데이터 검증
    if (!categoryData.name || categoryData.name.trim().length === 0) {
      throw new Error('카테고리명을 입력해주세요.');
    }

    if (categoryData.name.length > 50) {
      throw new Error('카테고리명은 50자를 초과할 수 없습니다.');
    }

    // 2. 기존 카테고리 목록 조회하여 중복 확인
    const existingCategories = await fetch(`${apiUrl}/api/categories`).then(r => r.json());
    const isDuplicate = existingCategories.some(cat => 
      cat.name.toLowerCase() === categoryData.name.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error(`"${categoryData.name}"은 이미 존재하는 카테고리입니다.`);
    }

    // 3. 카테고리 생성
    console.log(`🔄 카테고리 "${categoryData.name}" 생성 중...`);
    const newCategory = await createCategory(apiUrl, token, {
      name: categoryData.name.trim(),
      description: categoryData.description?.trim() || ''
    });

    console.log(`✅ 카테고리 "${newCategory.name}" 생성 완료 (ID: ${newCategory.id})`);
    return newCategory;

  } catch (error) {
    console.error('❌ 카테고리 생성 실패:', error.message);
    throw error;
  }
}

// 사용 예시
const result = await validateAndCreateCategory('https://your-domain.com', 'YOUR_JWT_TOKEN', {
  name: '산업동향',
  description: '메타버스 산업 현황 및 전망 분석'
});
```

### 3. 일괄 카테고리 생성

```javascript
async function bulkCreateCategories(apiUrl, token, categories, options = {}) {
  const { 
    batchSize = 5, 
    delay = 1000,
    skipDuplicates = true 
  } = options;
  
  const results = [];
  
  console.log(`📦 ${categories.length}개 카테고리 일괄 생성 시작`);
  
  // 기존 카테고리 조회
  let existingCategories = [];
  if (skipDuplicates) {
    existingCategories = await fetch(`${apiUrl}/api/categories`).then(r => r.json());
  }

  // 배치 단위로 처리
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    console.log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (const categoryData of batch) {
      try {
        // 중복 검사
        if (skipDuplicates) {
          const isDuplicate = existingCategories.some(cat => 
            cat.name.toLowerCase() === categoryData.name.toLowerCase()
          );
          
          if (isDuplicate) {
            console.log(`  ⏭️  스킵: "${categoryData.name}" (이미 존재)`);
            results.push({
              success: false,
              skipped: true,
              name: categoryData.name,
              reason: '이미 존재하는 카테고리'
            });
            continue;
          }
        }

        // 카테고리 생성
        const newCategory = await createCategory(apiUrl, token, categoryData);
        results.push({
          success: true,
          category: newCategory
        });
        console.log(`  ✅ 생성: "${newCategory.name}" (ID: ${newCategory.id})`);

        // 생성된 카테고리를 기존 목록에 추가
        if (skipDuplicates) {
          existingCategories.push(newCategory);
        }

        // 요청 간 지연
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        results.push({
          success: false,
          name: categoryData.name,
          error: error.message
        });
        console.log(`  ❌ 실패: "${categoryData.name}" - ${error.message}`);
      }
    }

    // 배치 간 지연
    if (i + batchSize < categories.length) {
      console.log(`⏳ ${delay}ms 대기 중...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 결과 요약
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success && !r.skipped);
  const skipped = results.filter(r => r.skipped);

  console.log(`\n📊 일괄 생성 완료`);
  console.log(`✅ 성공: ${successful.length}개`);
  console.log(`❌ 실패: ${failed.length}개`);
  console.log(`⏭️  스킵: ${skipped.length}개`);

  return { 
    results, 
    summary: { 
      successful: successful.length, 
      failed: failed.length, 
      skipped: skipped.length 
    } 
  };
}

// 사용 예시
const categoriesToCreate = [
  { name: '산업동향', description: '메타버스 산업 현황 및 전망' },
  { name: '기업분석', description: '주요 기업들의 메타버스 사업 분석' },
  { name: '투자동향', description: '메타버스 관련 투자 및 펀딩 현황' },
  { name: '플랫폼분석', description: '메타버스 플랫폼별 특징 및 비교' },
  { name: '사용자분석', description: '메타버스 사용자 행태 및 트렌드' }
];

const result = await bulkCreateCategories(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  categoriesToCreate,
  {
    batchSize: 3,
    delay: 1500,
    skipDuplicates: true
  }
);
```

### 4. CSV에서 카테고리 가져오기

```javascript
async function importCategoriesFromCSV(apiUrl, token, csvContent) {
  try {
    // CSV 파싱
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const categories = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length >= 1 && values[0]) {
        const category = {
          name: values[0],
          description: values[1] || ''
        };
        categories.push(category);
      }
    }

    console.log(`📂 CSV에서 ${categories.length}개 카테고리 파싱 완료`);
    
    // 일괄 생성 실행
    const result = await bulkCreateCategories(apiUrl, token, categories, {
      batchSize: 5,
      delay: 1000,
      skipDuplicates: true
    });

    // 결과를 CSV 형태로 저장
    const resultCsvContent = [
      'Name,Description,Status,Error',
      ...result.results.map(r => {
        if (r.success) {
          return `"${r.category.name}","${r.category.description}","SUCCESS",""`;
        } else if (r.skipped) {
          return `"${r.name}","","SKIPPED","${r.reason}"`;
        } else {
          return `"${r.name}","","FAILED","${r.error}"`;
        }
      })
    ].join('\n');

    // 결과 파일 저장
    const resultFilename = `category-import-result-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    require('fs').writeFileSync(resultFilename, resultCsvContent);
    console.log(`📄 결과 파일 저장: ${resultFilename}`);

    return { result, resultFilename };

  } catch (error) {
    console.error('❌ CSV 가져오기 실패:', error.message);
    throw error;
  }
}

// 사용 예시
const csvContent = `
Name,Description
"산업동향","메타버스 산업 현황 및 전망 분석"
"기업분석","주요 기업들의 메타버스 사업 분석"
"투자동향","메타버스 관련 투자 및 펀딩 현황"
"플랫폼분석","메타버스 플랫폼별 특징 및 비교분석"
"사용자분석","메타버스 사용자 행태 및 트렌드 분석"
`;

const importResult = await importCategoriesFromCSV(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  csvContent
);
```

### 5. 카테고리 계층 구조 생성

현재 API는 단일 레벨 카테고리만 지원하지만, 애플리케이션 레벨에서 계층 구조를 시뮬레이션할 수 있습니다:

```javascript
async function createCategoryHierarchy(apiUrl, token, hierarchy) {
  const results = [];
  
  // 계층 구조를 평면화하여 처리
  function flattenHierarchy(items, parent = '') {
    const flat = [];
    
    for (const item of items) {
      const fullName = parent ? `${parent} > ${item.name}` : item.name;
      
      flat.push({
        name: fullName,
        description: item.description,
        level: parent.split(' > ').length,
        parent: parent || null
      });
      
      if (item.children && item.children.length > 0) {
        flat.push(...flattenHierarchy(item.children, fullName));
      }
    }
    
    return flat;
  }
  
  const flatCategories = flattenHierarchy(hierarchy);
  
  console.log(`📊 계층형 카테고리 ${flatCategories.length}개 생성 시작`);
  
  // 레벨 순으로 정렬하여 상위 카테고리부터 생성
  flatCategories.sort((a, b) => a.level - b.level);
  
  for (const categoryData of flatCategories) {
    try {
      const newCategory = await createCategory(apiUrl, token, {
        name: categoryData.name,
        description: categoryData.description
      });
      
      results.push({
        success: true,
        category: newCategory,
        level: categoryData.level,
        parent: categoryData.parent
      });
      
      console.log(`  ${'  '.repeat(categoryData.level)}✅ ${categoryData.name} (ID: ${newCategory.id})`);
      
      // 계층 생성 간 지연
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.push({
        success: false,
        name: categoryData.name,
        error: error.message,
        level: categoryData.level
      });
      console.log(`  ${'  '.repeat(categoryData.level)}❌ ${categoryData.name} - ${error.message}`);
    }
  }
  
  return results;
}

// 사용 예시
const categoryHierarchy = [
  {
    name: '표준',
    description: '메타버스 표준화 관련 카테고리',
    children: [
      { name: 'ISO 표준', description: 'ISO에서 제정하는 메타버스 표준' },
      { name: 'ITU 표준', description: 'ITU에서 제정하는 메타버스 표준' },
      { name: 'IEEE 표준', description: 'IEEE에서 제정하는 메타버스 표준' }
    ]
  },
  {
    name: '기술',
    description: '메타버스 기술 관련 카테고리',
    children: [
      { name: '3D 기술', description: '3D 모델링, 렌더링 기술' },
      { name: 'VR/AR 기술', description: '가상현실 및 증강현실 기술' },
      { name: '블록체인', description: '메타버스에서의 블록체인 활용' }
    ]
  }
];

const hierarchyResult = await createCategoryHierarchy(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  categoryHierarchy
);
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | number | 생성된 카테고리 ID | `5` |
| `name` | string | 카테고리 이름 | `"산업동향"` |
| `description` | string | 카테고리 설명 | `"산업 현황 및 동향 분석 보고서"` |

## 제약 사항

- **이름 고유성**: 카테고리 이름은 시스템 내에서 고유해야 합니다
- **길이 제한**: 카테고리 이름은 적절한 길이를 유지해야 합니다
- **특수문자**: 일부 특수문자는 제한될 수 있습니다

이 API를 통해 시스템의 보고서 분류 체계를 유연하게 확장할 수 있습니다.