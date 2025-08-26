# 기관 생성 API

## 개요

새로운 기관을 생성합니다. 보고서 분류 체계를 확장할 때 사용되며, 관리자 권한이 필요합니다.

## 기본 정보

- **HTTP 메서드**: `POST`
- **엔드포인트**: `/api/organizations`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
POST /api/organizations
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### 요청 본문

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `name` | string | ✅ | 기관 이름 (고유값) | `"KISA"` |

### 요청 예시

```bash
curl -X POST https://your-domain.com/api/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "KISA"
  }'
```

## 응답 형식

### 성공 응답 (201)

```json
{
  "id": 6,
  "name": "KISA"
}
```

### 에러 응답

#### 필수 필드 누락 (400)
```json
{
  "message": "Organization name is required"
}
```

#### 중복된 기관명 (409)
```json
{
  "message": "Organization name already exists"
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
  "message": "Failed to create organization"
}
```

## 실용적인 사용 예시

### 1. JavaScript로 기관 생성

```javascript
async function createOrganization(apiUrl, token, organizationName) {
  try {
    const response = await fetch(`${apiUrl}/api/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: organizationName })
    });

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('이미 존재하는 기관명입니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      if (response.status === 400) {
        throw new Error('기관명은 필수 항목입니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newOrganization = await response.json();
    return newOrganization;
  } catch (error) {
    console.error('기관 생성 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const newOrganization = await createOrganization('https://your-domain.com', 'YOUR_JWT_TOKEN', 'KISA');
  console.log('✅ 기관 생성 성공:', newOrganization);
} catch (error) {
  console.error('❌ 생성 실패:', error.message);
}
```

### 2. 기관 검증 및 생성

```javascript
async function validateAndCreateOrganization(apiUrl, token, organizationName) {
  try {
    // 1. 입력 데이터 검증
    if (!organizationName || organizationName.trim().length === 0) {
      throw new Error('기관명을 입력해주세요.');
    }

    if (organizationName.length > 100) {
      throw new Error('기관명은 100자를 초과할 수 없습니다.');
    }

    // 2. 기존 기관 목록 조회하여 중복 확인
    const existingOrganizations = await fetch(`${apiUrl}/api/organizations`).then(r => r.json());
    const isDuplicate = existingOrganizations.some(org => 
      org.name.toLowerCase() === organizationName.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error(`"${organizationName}"은 이미 존재하는 기관명입니다.`);
    }

    // 3. 기관명 정규화
    const normalizedName = organizationName.trim()
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .replace(/[^\w\s\-\.]/g, '') // 특수문자 제거 (하이픈, 점 제외)
      .substring(0, 100); // 길이 제한

    if (normalizedName !== organizationName.trim()) {
      console.log(`📝 기관명이 정규화되었습니다: "${organizationName.trim()}" → "${normalizedName}"`);
    }

    // 4. 기관 생성
    console.log(`🔄 기관 "${normalizedName}" 생성 중...`);
    const newOrganization = await createOrganization(apiUrl, token, normalizedName);

    console.log(`✅ 기관 "${newOrganization.name}" 생성 완료 (ID: ${newOrganization.id})`);
    return newOrganization;

  } catch (error) {
    console.error('❌ 기관 생성 실패:', error.message);
    throw error;
  }
}

// 사용 예시
const result = await validateAndCreateOrganization('https://your-domain.com', 'YOUR_JWT_TOKEN', 'KISA');
```

### 3. 일괄 기관 생성

```javascript
async function bulkCreateOrganizations(apiUrl, token, organizationNames, options = {}) {
  const { 
    batchSize = 5, 
    delay = 1000,
    skipDuplicates = true,
    normalize = true
  } = options;
  
  const results = [];
  
  console.log(`📦 ${organizationNames.length}개 기관 일괄 생성 시작`);
  
  // 기존 기관 조회 (중복 검사용)
  let existingOrganizations = [];
  if (skipDuplicates) {
    existingOrganizations = await fetch(`${apiUrl}/api/organizations`).then(r => r.json());
  }

  // 배치 단위로 처리
  for (let i = 0; i < organizationNames.length; i += batchSize) {
    const batch = organizationNames.slice(i, i + batchSize);
    console.log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (let orgName of batch) {
      try {
        // 정규화
        if (normalize) {
          orgName = orgName.trim().replace(/\s+/g, ' ').substring(0, 100);
        }

        // 중복 검사
        if (skipDuplicates) {
          const isDuplicate = existingOrganizations.some(org => 
            org.name.toLowerCase() === orgName.toLowerCase()
          );
          
          if (isDuplicate) {
            console.log(`  ⏭️  스킵: "${orgName}" (이미 존재)`);
            results.push({
              success: false,
              skipped: true,
              name: orgName,
              reason: '이미 존재하는 기관'
            });
            continue;
          }
        }

        // 기관 생성
        const newOrganization = await createOrganization(apiUrl, token, orgName);
        results.push({
          success: true,
          organization: newOrganization
        });
        console.log(`  ✅ 생성: "${newOrganization.name}" (ID: ${newOrganization.id})`);

        // 생성된 기관을 기존 목록에 추가
        if (skipDuplicates) {
          existingOrganizations.push(newOrganization);
        }

        // 요청 간 지연
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        results.push({
          success: false,
          name: orgName,
          error: error.message
        });
        console.log(`  ❌ 실패: "${orgName}" - ${error.message}`);
      }
    }

    // 배치 간 지연
    if (i + batchSize < organizationNames.length) {
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
const organizationsToCreate = [
  'KISA',
  'KINS',
  'KRISS', 
  'KETI',
  'KAIST',
  '한국인터넷진흥원', // 이미 KISA가 있다면 스킵될 수 있음
  'NIST',  // 이미 존재한다면 스킵
  'IETF',
  'W3C'
];

const result = await bulkCreateOrganizations(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  organizationsToCreate,
  {
    batchSize: 3,
    delay: 1500,
    skipDuplicates: true,
    normalize: true
  }
);

console.log('생성 요약:', result.summary);
```

### 4. CSV에서 기관 가져오기

```javascript
async function importOrganizationsFromCSV(apiUrl, token, csvContent) {
  try {
    // CSV 파싱
    const lines = csvContent.trim().split('\n');
    const organizations = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 빈 라인 스킵
      if (!line) continue;
      
      // 헤더 라인 스킵 (선택적)
      if (i === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('기관'))) {
        continue;
      }
      
      // 쉼표로 분할하고 따옴표 제거
      let orgName = line.split(',')[0].trim().replace(/"/g, '');
      
      if (orgName) {
        organizations.push(orgName);
      }
    }

    console.log(`📂 CSV에서 ${organizations.length}개 기관 파싱 완료`);
    
    // 일괄 생성 실행
    const result = await bulkCreateOrganizations(apiUrl, token, organizations, {
      batchSize: 5,
      delay: 1000,
      skipDuplicates: true,
      normalize: true
    });

    // 결과를 CSV 형태로 저장
    const resultCsvContent = [
      'Name,Status,Error',
      ...result.results.map(r => {
        if (r.success) {
          return `"${r.organization.name}","SUCCESS",""`;
        } else if (r.skipped) {
          return `"${r.name}","SKIPPED","${r.reason}"`;
        } else {
          return `"${r.name}","FAILED","${r.error}"`;
        }
      })
    ].join('\n');

    // 결과 파일 저장
    const resultFilename = `organization-import-result-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
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
Name
"KISA"
"한국인터넷진흥원"
"KINS"
"KRISS"
"KETI"
"KAIST"
"IETF"
"W3C"
"OASIS"
`;

const importResult = await importOrganizationsFromCSV(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  csvContent
);

console.log('가져오기 완료:', importResult.result.summary);
```

### 5. 기관 계층 구조 생성

일부 기관은 상위 조직을 가질 수 있습니다. 현재 API는 단일 레벨만 지원하지만 명명 규칙으로 계층을 표현할 수 있습니다:

```javascript
async function createOrganizationHierarchy(apiUrl, token, hierarchy) {
  const results = [];
  
  // 계층 구조를 평면화
  function flattenHierarchy(items, parent = '') {
    const flat = [];
    
    for (const item of items) {
      // 부모가 있는 경우 "부모 - 자식" 형태로 이름 구성
      const fullName = parent ? `${parent} - ${item.name}` : item.name;
      
      flat.push({
        name: fullName,
        level: parent.split(' - ').filter(Boolean).length,
        parent: parent || null
      });
      
      if (item.children && item.children.length > 0) {
        flat.push(...flattenHierarchy(item.children, fullName));
      }
    }
    
    return flat;
  }
  
  const flatOrganizations = flattenHierarchy(hierarchy);
  
  console.log(`📊 계층형 기관 ${flatOrganizations.length}개 생성 시작`);
  
  // 레벨 순으로 정렬하여 상위 기관부터 생성
  flatOrganizations.sort((a, b) => a.level - b.level);
  
  for (const orgData of flatOrganizations) {
    try {
      const newOrganization = await createOrganization(apiUrl, token, orgData.name);
      
      results.push({
        success: true,
        organization: newOrganization,
        level: orgData.level,
        parent: orgData.parent
      });
      
      console.log(`  ${'  '.repeat(orgData.level)}✅ ${orgData.name} (ID: ${newOrganization.id})`);
      
      // 계층 생성 간 지연
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.push({
        success: false,
        name: orgData.name,
        error: error.message,
        level: orgData.level
      });
      console.log(`  ${'  '.repeat(orgData.level)}❌ ${orgData.name} - ${error.message}`);
    }
  }
  
  return results;
}

// 사용 예시
const organizationHierarchy = [
  {
    name: 'ITU',
    children: [
      { name: 'ITU-T' },
      { name: 'ITU-R' },
      { name: 'ITU-D' }
    ]
  },
  {
    name: 'ISO',
    children: [
      { name: 'ISO/TC 276', children: [{ name: 'ISO/TC 276/WG 1' }, { name: 'ISO/TC 276/WG 2' }] },
      { name: 'ISO/IEC JTC 1' }
    ]
  },
  {
    name: 'IEEE',
    children: [
      { name: 'IEEE SA' },
      { name: 'IEEE Computer Society' }
    ]
  }
];

const hierarchyResult = await createOrganizationHierarchy(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  organizationHierarchy
);

console.log('계층 생성 완료:', hierarchyResult.filter(r => r.success).length, '개 성공');
```

### 6. 기관명 정규화 및 표준화

```javascript
class OrganizationNameNormalizer {
  constructor() {
    // 표준 약어 매핑
    this.standardAbbreviations = {
      '한국인터넷진흥원': 'KISA',
      '한국과학기술연구원': 'KIST',
      '한국표준과학연구원': 'KRISS',
      '한국전자통신연구원': 'ETRI',
      '한국정보통신기술협회': 'TTA',
      '국제전기통신연합': 'ITU',
      '국제표준화기구': 'ISO',
      '전기전자기술자협회': 'IEEE',
      '인터넷기술작업반': 'IETF',
      '월드와이드웹컨소시엄': 'W3C'
    };
    
    // 일반적인 정리 규칙
    this.cleanupRules = [
      { pattern: /주식회사/g, replacement: '' },
      { pattern: /\(주\)/g, replacement: '' },
      { pattern: /Inc\.|Incorporated/gi, replacement: '' },
      { pattern: /Ltd\.|Limited/gi, replacement: '' },
      { pattern: /Corp\.|Corporation/gi, replacement: '' },
      { pattern: /\s+/g, replacement: ' ' }, // 연속 공백 정리
    ];
  }
  
  normalize(organizationName) {
    let normalized = organizationName.trim();
    
    // 표준 약어 변환
    if (this.standardAbbreviations[normalized]) {
      normalized = this.standardAbbreviations[normalized];
    }
    
    // 정리 규칙 적용
    for (const rule of this.cleanupRules) {
      normalized = normalized.replace(rule.pattern, rule.replacement);
    }
    
    // 앞뒤 공백 제거
    normalized = normalized.trim();
    
    return {
      original: organizationName,
      normalized,
      wasChanged: organizationName !== normalized
    };
  }
  
  async createNormalizedOrganizations(apiUrl, token, organizationNames) {
    const results = [];
    
    console.log(`📝 ${organizationNames.length}개 기관명 정규화 및 생성`);
    
    for (const orgName of organizationNames) {
      const normalization = this.normalize(orgName);
      
      if (normalization.wasChanged) {
        console.log(`📝 정규화: "${normalization.original}" → "${normalization.normalized}"`);
      }
      
      try {
        const newOrganization = await createOrganization(apiUrl, token, normalization.normalized);
        results.push({
          success: true,
          organization: newOrganization,
          original: normalization.original,
          normalized: normalization.normalized,
          wasNormalized: normalization.wasChanged
        });
        
        console.log(`  ✅ 생성: ${newOrganization.name} (ID: ${newOrganization.id})`);
        
      } catch (error) {
        results.push({
          success: false,
          original: normalization.original,
          normalized: normalization.normalized,
          error: error.message
        });
        console.log(`  ❌ 실패: ${normalization.normalized} - ${error.message}`);
      }
      
      // 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const normalized = results.filter(r => r.wasNormalized);
    const successful = results.filter(r => r.success);
    
    console.log(`\n📊 정규화 및 생성 완료:`);
    console.log(`📝 정규화된 이름: ${normalized.length}개`);
    console.log(`✅ 생성 성공: ${successful.length}개`);
    
    return results;
  }
}

// 사용 예시
const normalizer = new OrganizationNameNormalizer();

// 단일 정규화
const result = normalizer.normalize('한국인터넷진흥원 (주)');
console.log(result); // { original: '한국인터넷진흥원 (주)', normalized: 'KISA', wasChanged: true }

// 일괄 정규화 및 생성
const organizationsToNormalize = [
  '한국인터넷진흥원',
  '한국전자통신연구원 (주)',
  'International Telecommunication Union',
  'IEEE Computer Society Inc.',
  'ETRI'
];

const normalizationResults = await normalizer.createNormalizedOrganizations(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  organizationsToNormalize
);
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | number | 생성된 기관 ID | `6` |
| `name` | string | 기관 이름 | `"KISA"` |

## 제약 사항

- **이름 고유성**: 기관 이름은 시스템 내에서 고유해야 합니다
- **길이 제한**: 기관 이름은 적절한 길이를 유지해야 합니다 (보통 100자 이내)
- **특수문자**: 일부 특수문자는 제한될 수 있습니다

이 API를 통해 시스템의 기관 분류 체계를 유연하게 확장할 수 있습니다.