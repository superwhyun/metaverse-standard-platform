# 기관 수정 API

## 개요

기존 기관의 정보를 수정합니다. 기관 이름을 변경할 수 있으며, 관리자 권한이 필요합니다.

## 기본 정보

- **HTTP 메서드**: `PUT`
- **엔드포인트**: `/api/organizations/{id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
PUT /api/organizations/{id}
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 수정할 기관 ID | `1` |

### 요청 본문

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `name` | string | ✅ | 새로운 기관 이름 | `"ITU-T"` |

### 요청 예시

```bash
curl -X PUT https://your-domain.com/api/organizations/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "ITU-T"
  }'
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "id": 1,
  "name": "ITU-T"
}
```

### 에러 응답

#### 잘못된 ID (400)
```json
{
  "message": "Invalid organization ID"
}
```

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

#### 기관 없음 (404)
```json
{
  "message": "Organization not found"
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
  "message": "Failed to update organization"
}
```

## 실용적인 사용 예시

### 1. JavaScript로 기관 수정

```javascript
async function updateOrganization(apiUrl, token, organizationId, newName) {
  try {
    // 입력 검증
    if (!newName || newName.trim().length === 0) {
      throw new Error('기관명을 입력해주세요.');
    }

    const response = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName.trim() })
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('기관을 찾을 수 없습니다.');
      }
      if (response.status === 409) {
        throw new Error('이미 존재하는 기관명입니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      if (response.status === 400) {
        throw new Error('잘못된 요청입니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedOrganization = await response.json();
    return updatedOrganization;
  } catch (error) {
    console.error('기관 수정 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const updatedOrganization = await updateOrganization('https://your-domain.com', 'YOUR_JWT_TOKEN', 1, 'ITU-T');
  console.log('✅ 기관 수정 성공:', updatedOrganization);
} catch (error) {
  console.error('❌ 수정 실패:', error.message);
}
```

### 2. 안전한 기관 수정

```javascript
async function safeUpdateOrganization(apiUrl, token, organizationId, newName) {
  try {
    // 1. 기존 기관 정보 조회
    console.log(`🔍 기관 ID ${organizationId} 현재 정보 조회 중...`);
    const currentOrgResponse = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!currentOrgResponse.ok) {
      if (currentOrgResponse.status === 404) {
        throw new Error('수정하려는 기관을 찾을 수 없습니다.');
      }
      throw new Error('기관 정보 조회에 실패했습니다.');
    }

    const currentOrganization = await currentOrgResponse.json();

    console.log('📋 현재 기관 정보:');
    console.log(`  이름: ${currentOrganization.name}`);

    // 2. 변경사항 확인
    if (newName === currentOrganization.name) {
      console.log('ℹ️  변경사항이 없습니다.');
      return { success: true, organization: currentOrganization, noChanges: true };
    }

    console.log('📝 변경사항:');
    console.log(`  이름: "${currentOrganization.name}" → "${newName}"`);

    // 3. 이름 중복 확인
    const allOrganizations = await fetch(`${apiUrl}/api/organizations`).then(r => r.json());
    const isDuplicate = allOrganizations.some(org => 
      org.id !== organizationId && org.name.toLowerCase() === newName.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error(`"${newName}"은 이미 존재하는 기관명입니다.`);
    }

    // 4. 해당 기관을 사용하는 보고서 확인
    console.log('📊 해당 기관을 사용하는 보고서 확인 중...');
    const reportsResponse = await fetch(`${apiUrl}/api/reports/search?organization=${encodeURIComponent(currentOrganization.name)}&limit=5`);

    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      const relatedReports = reportsData.data || [];

      if (relatedReports.length > 0) {
        console.log(`⚠️  이 기관을 사용하는 ${reportsData.total || relatedReports.length}개의 보고서가 있습니다.`);
        console.log('   기관명 변경 시 모든 관련 보고서에 자동으로 반영됩니다.');
        
        relatedReports.slice(0, 3).forEach(report => {
          console.log(`  - ${report.title} (${report.date})`);
        });
      }
    }

    // 5. 실제 수정 실행
    console.log('🔄 기관 수정 중...');
    const updatedOrganization = await updateOrganization(apiUrl, token, organizationId, newName);

    console.log('✅ 기관 수정 완료');
    return {
      success: true,
      organization: updatedOrganization,
      previousOrganization: currentOrganization
    };

  } catch (error) {
    console.error('❌ 안전 수정 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 사용 예시
const result = await safeUpdateOrganization('https://your-domain.com', 'YOUR_JWT_TOKEN', 1, 'ITU-T');

if (result.success && !result.noChanges) {
  console.log('변경된 기관:', result.organization.name);
}
```

### 3. 일괄 기관 수정

```javascript
async function bulkUpdateOrganizations(apiUrl, token, updates, options = {}) {
  const { 
    batchSize = 5, 
    delay = 1000,
    safeMode = true 
  } = options;
  
  const results = [];
  
  console.log(`📦 ${updates.length}개 기관 일괄 수정 시작`);
  
  // 배치 단위로 처리
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    console.log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (const updateData of batch) {
      const { organizationId, newName } = updateData;
      
      try {
        let result;
        if (safeMode) {
          result = await safeUpdateOrganization(apiUrl, token, organizationId, newName);
        } else {
          const updatedOrganization = await updateOrganization(apiUrl, token, organizationId, newName);
          result = { success: true, organization: updatedOrganization };
        }
        
        if (result.success) {
          if (result.noChanges) {
            console.log(`  ➡️  변경사항 없음: ID ${organizationId}`);
          } else {
            console.log(`  ✅ 수정 완료: ${result.organization.name} (ID: ${organizationId})`);
          }
        }
        
        results.push({ ...result, organizationId });

      } catch (error) {
        results.push({
          success: false,
          organizationId,
          error: error.message
        });
        console.log(`  ❌ 수정 실패: ID ${organizationId} - ${error.message}`);
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
const organizationsToUpdate = [
  {
    organizationId: 1,
    newName: 'ITU-T'
  },
  {
    organizationId: 2,
    newName: 'ISO/IEC'
  },
  {
    organizationId: 3,
    newName: 'IEEE-SA'
  }
];

const bulkResult = await bulkUpdateOrganizations(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  organizationsToUpdate,
  {
    batchSize: 2,
    delay: 1500,
    safeMode: true
  }
);
```

### 4. CSV 데이터를 이용한 기관 업데이트

```javascript
async function updateOrganizationsFromCSV(apiUrl, token, csvContent) {
  try {
    // CSV 파싱
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const updates = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length >= 2 && values[0] && values[1]) {
        updates.push({
          organizationId: parseInt(values[0]),
          newName: values[1]
        });
      }
    }

    console.log(`📂 CSV에서 ${updates.length}개 기관 업데이트 파싱 완료`);
    
    // 일괄 업데이트 실행
    const result = await bulkUpdateOrganizations(apiUrl, token, updates, {
      batchSize: 3,
      delay: 1000,
      safeMode: true
    });

    // 결과를 CSV 형태로 저장
    const resultCsvContent = [
      'ID,NewName,Status,Error',
      ...result.results.map(r => {
        if (r.success && !r.noChanges) {
          return `${r.organizationId},"${r.organization.name}","SUCCESS",""`;
        } else if (r.noChanges) {
          return `${r.organizationId},"","NO_CHANGES",""`;
        } else {
          return `${r.organizationId},"","FAILED","${r.error}"`;
        }
      })
    ].join('\n');

    // 결과 파일 저장
    const resultFilename = `organization-update-result-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
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
ID,NewName
1,"ITU-T"
2,"ISO/IEC JTC 1"
3,"IEEE Standards Association"
4,"ETRI"
`;

const updateResult = await updateOrganizationsFromCSV(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  csvContent
);
```

### 5. 기관명 표준화

```javascript
class OrganizationNameStandardizer {
  constructor() {
    // 표준화 규칙
    this.standardizations = {
      // 공통 약어 표준화
      'International Telecommunication Union': 'ITU',
      'International Organization for Standardization': 'ISO',
      'Institute of Electrical and Electronics Engineers': 'IEEE',
      'Internet Engineering Task Force': 'IETF',
      'World Wide Web Consortium': 'W3C',
      
      // 한국 기관 표준화
      '한국인터넷진흥원': 'KISA',
      '한국전자통신연구원': 'ETRI',
      '한국정보통신기술협회': 'TTA',
      '한국표준과학연구원': 'KRISS',
      
      // 대소문자 표준화
      'itu': 'ITU',
      'iso': 'ISO',
      'ieee': 'IEEE',
      'etri': 'ETRI',
      'nist': 'NIST',
      'w3c': 'W3C'
    };
    
    // 접미사 제거 규칙
    this.suffixRules = [
      / Inc\.?$/i,
      / Corp\.?$/i,
      / Ltd\.?$/i,
      / Limited$/i,
      / Corporation$/i,
      / Company$/i,
      / 주식회사$/,
      / \(주\)$/
    ];
  }
  
  standardize(organizationName) {
    let standardized = organizationName.trim();
    
    // 표준 이름으로 변환
    if (this.standardizations[standardized]) {
      standardized = this.standardizations[standardized];
    } else if (this.standardizations[standardized.toLowerCase()]) {
      standardized = this.standardizations[standardized.toLowerCase()];
    }
    
    // 접미사 제거
    for (const rule of this.suffixRules) {
      standardized = standardized.replace(rule, '');
    }
    
    // 연속 공백 정리
    standardized = standardized.replace(/\s+/g, ' ').trim();
    
    return {
      original: organizationName,
      standardized,
      wasChanged: organizationName !== standardized
    };
  }
  
  async standardizeOrganizations(apiUrl, token, organizationIds) {
    const results = [];
    
    console.log(`📝 ${organizationIds.length}개 기관명 표준화 시작`);
    
    // 현재 기관 목록 조회
    const allOrganizations = await fetch(`${apiUrl}/api/organizations`).then(r => r.json());
    
    for (const orgId of organizationIds) {
      try {
        const organization = allOrganizations.find(org => org.id === orgId);
        if (!organization) {
          results.push({
            success: false,
            organizationId: orgId,
            error: '기관을 찾을 수 없습니다.'
          });
          continue;
        }
        
        const standardization = this.standardize(organization.name);
        
        if (!standardization.wasChanged) {
          console.log(`  ➡️  표준화 불필요: ${organization.name}`);
          results.push({
            success: true,
            organizationId: orgId,
            organization: organization,
            noChanges: true
          });
          continue;
        }
        
        console.log(`📝 표준화: "${standardization.original}" → "${standardization.standardized}"`);
        
        // 중복 확인
        const isDuplicate = allOrganizations.some(org => 
          org.id !== orgId && org.name.toLowerCase() === standardization.standardized.toLowerCase()
        );
        
        if (isDuplicate) {
          console.log(`  ⚠️  스킵: "${standardization.standardized}" (중복)`);
          results.push({
            success: false,
            organizationId: orgId,
            error: '표준화된 이름이 이미 존재합니다.',
            skipped: true
          });
          continue;
        }
        
        // 업데이트 실행
        const updatedOrganization = await updateOrganization(apiUrl, token, orgId, standardization.standardized);
        
        results.push({
          success: true,
          organizationId: orgId,
          organization: updatedOrganization,
          original: standardization.original,
          standardized: standardization.standardized
        });
        
        console.log(`  ✅ 표준화 완료: ${updatedOrganization.name} (ID: ${orgId})`);
        
        // 업데이트된 정보를 로컬 배열에도 반영
        const index = allOrganizations.findIndex(org => org.id === orgId);
        if (index !== -1) {
          allOrganizations[index] = updatedOrganization;
        }
        
      } catch (error) {
        results.push({
          success: false,
          organizationId: orgId,
          error: error.message
        });
        console.log(`  ❌ 표준화 실패: ID ${orgId} - ${error.message}`);
      }
      
      // 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const successful = results.filter(r => r.success && !r.noChanges);
    const noChanges = results.filter(r => r.noChanges);
    const failed = results.filter(r => !r.success);
    const skipped = results.filter(r => r.skipped);
    
    console.log(`\n📊 표준화 완료:`);
    console.log(`✅ 성공: ${successful.length}개`);
    console.log(`➡️  변경없음: ${noChanges.length}개`);
    console.log(`⏭️  스킵: ${skipped.length}개`);
    console.log(`❌ 실패: ${failed.length}개`);
    
    return { 
      results, 
      summary: { 
        successful: successful.length,
        noChanges: noChanges.length, 
        skipped: skipped.length,
        failed: failed.length 
      } 
    };
  }
}

// 사용 예시
const standardizer = new OrganizationNameStandardizer();

// 단일 표준화
const result = standardizer.standardize('International Telecommunication Union Inc.');
console.log(result); // { original: 'International...', standardized: 'ITU', wasChanged: true }

// 일괄 표준화
const standardizationResults = await standardizer.standardizeOrganizations(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  [1, 2, 3, 4, 5] // 표준화할 기관 ID들
);
```

### 6. 백업과 롤백 기능

```javascript
class OrganizationUpdateManager {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.backups = [];
  }
  
  async updateWithBackup(organizationId, newName) {
    try {
      // 1. 백업 생성
      const originalOrganization = await fetch(`${this.apiUrl}/api/organizations/${organizationId}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }).then(r => r.json());
      
      const backup = {
        id: Date.now(),
        organizationId,
        original: originalOrganization,
        timestamp: new Date().toISOString(),
        newName
      };
      
      // 2. 업데이트 실행
      const updatedOrganization = await updateOrganization(this.apiUrl, this.token, organizationId, newName);
      
      // 3. 백업 저장
      backup.updated = updatedOrganization;
      this.backups.push(backup);
      
      console.log(`💾 백업 생성: ${originalOrganization.name} → ${updatedOrganization.name}`);
      return { success: true, organization: updatedOrganization, backupId: backup.id };
      
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
      const restoredOrganization = await updateOrganization(
        this.apiUrl, 
        this.token, 
        backup.organizationId, 
        backup.original.name
      );
      
      console.log(`♻️  롤백 완료: ${backup.updated.name} → ${backup.original.name}`);
      return { success: true, organization: restoredOrganization };
      
    } catch (error) {
      console.error('❌ 롤백 실패:', error);
      throw error;
    }
  }
  
  getBackups() {
    return this.backups.map(backup => ({
      id: backup.id,
      organizationId: backup.organizationId,
      timestamp: backup.timestamp,
      changes: {
        from: backup.original.name,
        to: backup.updated?.name || backup.newName
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
const updateManager = new OrganizationUpdateManager('https://your-domain.com', 'YOUR_JWT_TOKEN');

// 백업과 함께 업데이트
const updateResult = await updateManager.updateWithBackup(1, 'ITU-T');

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
| `id` | number | 기관 ID | `1` |
| `name` | string | 수정된 기관 이름 | `"ITU-T"` |

## 주의사항

- 기관 이름 변경 시 이름 중복을 확인해야 합니다
- 이 기관을 사용하는 기존 보고서들의 참조는 자동으로 업데이트됩니다
- 중요한 변경사항은 사전에 백업을 생성하는 것을 권장합니다

이 API를 통해 기관 정보를 안전하고 효율적으로 관리할 수 있습니다.