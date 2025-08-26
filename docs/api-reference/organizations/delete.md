# 기관 삭제 API

## 개요

기존 기관을 삭제합니다. 해당 기관을 사용하는 보고서가 있는 경우 삭제가 제한될 수 있으며, 관리자 권한이 필요합니다.

## 기본 정보

- **HTTP 메서드**: `DELETE`
- **엔드포인트**: `/api/organizations/{id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
DELETE /api/organizations/{id}
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 삭제할 기관 ID | `5` |

### 요청 예시

```bash
curl -X DELETE https://your-domain.com/api/organizations/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "message": "Organization deleted successfully"
}
```

### 에러 응답

#### 잘못된 ID 형식 (400)
```json
{
  "message": "Invalid ID format"
}
```

#### 기관 없음 (404)
```json
{
  "message": "Organization not found or could not be deleted"
}
```

#### 참조 제약 위반 (409)
```json
{
  "message": "Cannot delete organization: reports are still using this organization"
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
  "message": "Failed to delete organization"
}
```

## 실용적인 사용 예시

### 1. 기본 기관 삭제

```javascript
async function deleteOrganization(apiUrl, token, organizationId) {
  try {
    const response = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('기관을 찾을 수 없습니다.');
      }
      if (response.status === 409) {
        throw new Error('이 기관을 사용하는 보고서가 있어 삭제할 수 없습니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      if (response.status === 400) {
        throw new Error('유효하지 않은 기관 ID입니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('기관 삭제 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const deleted = await deleteOrganization('https://your-domain.com', 'YOUR_JWT_TOKEN', 5);
  console.log('✅ 기관이 성공적으로 삭제되었습니다.');
} catch (error) {
  console.error('❌ 삭제 실패:', error.message);
}
```

### 2. 안전한 기관 삭제

```javascript
async function safeDeleteOrganization(apiUrl, token, organizationId) {
  try {
    // 1. 기관 정보 조회
    console.log(`🔍 기관 ID ${organizationId} 정보 조회 중...`);
    const organizationResponse = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!organizationResponse.ok) {
      if (organizationResponse.status === 404) {
        throw new Error('삭제하려는 기관을 찾을 수 없습니다.');
      }
      throw new Error('기관 정보 조회에 실패했습니다.');
    }

    const organization = await organizationResponse.json();

    // 2. 해당 기관을 사용하는 보고서 확인
    console.log('📊 해당 기관을 사용하는 보고서 확인 중...');
    const reportsResponse = await fetch(`${apiUrl}/api/reports/search?organization=${encodeURIComponent(organization.name)}&limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      const relatedReports = reportsData.data || [];

      if (relatedReports.length > 0) {
        console.log(`⚠️  해당 기관을 사용하는 ${relatedReports.length}개의 보고서가 있습니다:`);
        relatedReports.slice(0, 5).forEach(report => {
          console.log(`  - ${report.title} (${report.date})`);
        });
        
        if (relatedReports.length > 5) {
          console.log(`  ... 그 외 ${relatedReports.length - 5}개`);
        }
        
        throw new Error(`이 기관을 사용하는 ${relatedReports.length}개의 보고서가 있어 삭제할 수 없습니다. 먼저 관련 보고서들을 다른 기관으로 이동시키거나 삭제해주세요.`);
      }
    }

    // 3. 삭제 정보 표시
    console.log('🗑️  삭제 예정 기관 정보:');
    console.log(`  ID: ${organization.id}`);
    console.log(`  이름: ${organization.name}`);

    // 4. 실제 삭제 실행
    console.log('⏳ 기관 삭제 중...');
    const deleteResult = await deleteOrganization(apiUrl, token, organizationId);

    console.log('✅ 기관이 성공적으로 삭제되었습니다.');
    return {
      success: true,
      deletedOrganization: {
        id: organization.id,
        name: organization.name
      }
    };

  } catch (error) {
    console.error('❌ 안전 삭제 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 사용 예시
const result = await safeDeleteOrganization('https://your-domain.com', 'YOUR_JWT_TOKEN', 5);
if (result.success) {
  console.log('삭제된 기관:', result.deletedOrganization.name);
}
```

### 3. 강제 삭제 (관련 보고서 기관 변경 후 삭제)

```javascript
async function forceDeleteOrganization(apiUrl, token, organizationId, replacementOrganizationId) {
  try {
    // 1. 대상 및 대체 기관 정보 조회
    const [targetOrganization, replacementOrganization] = await Promise.all([
      fetch(`${apiUrl}/api/organizations/${organizationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${apiUrl}/api/organizations/${replacementOrganizationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ]);

    console.log(`🔄 "${targetOrganization.name}" → "${replacementOrganization.name}" 기관 이동 및 삭제`);

    // 2. 관련 보고서 조회
    const reportsResponse = await fetch(`${apiUrl}/api/reports/search?organization=${encodeURIComponent(targetOrganization.name)}&limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let relatedReports = [];
    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      relatedReports = reportsData.data || [];
    }

    console.log(`📊 이동할 보고서: ${relatedReports.length}개`);

    // 3. 보고서 기관 일괄 변경
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
            organization: replacementOrganization.name
          })
        })
      );

      const updateResults = await Promise.allSettled(updatePromises);
      const successCount = updateResults.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failureCount = updateResults.length - successCount;

      console.log(`📝 보고서 기관 변경: ${successCount}개 성공, ${failureCount}개 실패`);

      if (failureCount > 0) {
        console.warn(`⚠️  ${failureCount}개 보고서의 기관 변경에 실패했습니다.`);
      }
    }

    // 4. 기관 삭제
    const deleteResult = await safeDeleteOrganization(apiUrl, token, organizationId);
    
    return {
      ...deleteResult,
      movedReports: relatedReports.length,
      targetOrganization: targetOrganization.name,
      replacementOrganization: replacementOrganization.name
    };

  } catch (error) {
    console.error('❌ 강제 삭제 실패:', error);
    throw error;
  }
}

// 사용 예시
const forceResult = await forceDeleteOrganization(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  5, // 삭제할 기관 ID
  1  // 대체 기관 ID
);

if (forceResult.success) {
  console.log(`✅ "${forceResult.targetOrganization}" 기관 삭제 완료`);
  console.log(`📊 ${forceResult.movedReports}개 보고서를 "${forceResult.replacementOrganization}"로 이동`);
}
```

### 4. 일괄 기관 삭제

```javascript
async function bulkDeleteOrganizations(apiUrl, token, organizationIds, options = {}) {
  const { 
    batchSize = 3, 
    delay = 1500,
    safeMode = true,
    createBackup = false 
  } = options;
  
  const results = [];
  const backup = [];

  console.log(`🗑️  ${organizationIds.length}개 기관 일괄 삭제 시작`);
  console.log(`배치 크기: ${batchSize}, 지연시간: ${delay}ms, 안전모드: ${safeMode}`);

  // 배치 단위로 처리
  for (let i = 0; i < organizationIds.length; i += batchSize) {
    const batch = organizationIds.slice(i, i + batchSize);
    console.log(`\n📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (const organizationId of batch) {
      try {
        let organizationInfo = null;

        // 백업 생성 또는 안전모드
        if (safeMode || createBackup) {
          const organizationResponse = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (organizationResponse.ok) {
            organizationInfo = await organizationResponse.json();
            
            if (createBackup) {
              backup.push(organizationInfo);
            }
          }
        }

        // 삭제 실행
        let deleteResult;
        if (safeMode) {
          deleteResult = await safeDeleteOrganization(apiUrl, token, organizationId);
        } else {
          const deleted = await deleteOrganization(apiUrl, token, organizationId);
          deleteResult = { success: true };
        }

        if (deleteResult.success) {
          results.push({
            success: true,
            id: organizationId,
            name: organizationInfo?.name || `ID ${organizationId}`,
            deletedAt: new Date().toISOString()
          });
          console.log(`  ✅ 삭제 성공: ${organizationInfo?.name || `ID ${organizationId}`}`);
        } else {
          results.push({
            success: false,
            id: organizationId,
            error: deleteResult.error
          });
          console.log(`  ❌ 삭제 실패: ID ${organizationId} - ${deleteResult.error}`);
        }

        // 요청 간 지연
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.push({
          success: false,
          id: organizationId,
          error: error.message
        });
        console.log(`  ❌ 오류: ID ${organizationId} - ${error.message}`);
      }
    }

    // 배치 간 지연
    if (i + batchSize < organizationIds.length) {
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
    const backupFilename = `deleted-organizations-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    require('fs').writeFileSync(backupFilename, JSON.stringify(backup, null, 2));
    console.log(`💾 백업 파일 생성: ${backupFilename}`);
  }

  return { results, backup, summary: { successful: successful.length, failed: failed.length } };
}

// 사용 예시
const organizationIdsToDelete = [5, 6, 7, 8];

const deleteResult = await bulkDeleteOrganizations(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  organizationIdsToDelete,
  {
    batchSize: 2,
    delay: 2000,
    safeMode: true,
    createBackup: true
  }
);

console.log('삭제 요약:', deleteResult.summary);
```

### 5. 조건부 기관 삭제

```javascript
async function deleteOrganizationsByCondition(apiUrl, token, condition, options = {}) {
  const { safeMode = true, createBackup = true } = options;

  try {
    // 1. 모든 기관 조회
    console.log('🔍 조건에 맞는 기관 검색 중...');
    const organizationsResponse = await fetch(`${apiUrl}/api/organizations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!organizationsResponse.ok) {
      throw new Error('기관 목록 조회 실패');
    }

    const allOrganizations = await organizationsResponse.json();

    // 2. 조건 필터링
    const toDelete = allOrganizations.filter(organization => {
      // 이름 패턴 매칭
      if (condition.namePattern) {
        const regex = new RegExp(condition.namePattern, 'i');
        if (!regex.test(organization.name)) return false;
      }
      
      // ID 범위
      if (condition.idRange) {
        if (organization.id < condition.idRange.min || organization.id > condition.idRange.max) return false;
      }
      
      // 사용하지 않는 기관 (보고서가 0개)
      if (condition.unusedOnly) {
        // 이 옵션은 추가 API 호출이 필요하므로 별도 처리가 필요
        return true; // 일단 통과시키고 나중에 필터링
      }
      
      return true;
    });

    if (toDelete.length === 0) {
      console.log('조건에 맞는 기관이 없습니다.');
      return { deleted: [], total: 0 };
    }

    // 3. 사용하지 않는 기관 필터링 (옵션)
    if (condition.unusedOnly) {
      console.log('🔍 사용하지 않는 기관 확인 중...');
      const unusedOrganizations = [];
      
      for (const org of toDelete) {
        const reportsResponse = await fetch(`${apiUrl}/api/reports/search?organization=${encodeURIComponent(org.name)}&limit=1`);
        
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          if (reportsData.total === 0) {
            unusedOrganizations.push(org);
          }
        }
        
        // API 부하 방지
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`📊 사용하지 않는 기관: ${unusedOrganizations.length}/${toDelete.length}개`);
      toDelete.splice(0, toDelete.length, ...unusedOrganizations);
    }

    if (toDelete.length === 0) {
      console.log('삭제 조건에 맞는 기관이 없습니다.');
      return { deleted: [], total: 0 };
    }

    // 4. 삭제 예정 목록 표시
    console.log(`\n📋 삭제 예정 기관 (${toDelete.length}개):`);
    toDelete.forEach((organization, index) => {
      console.log(`  ${index + 1}. ${organization.name} (ID: ${organization.id})`);
    });

    // 5. 일괄 삭제 실행
    const organizationIds = toDelete.map(o => o.id);
    const deleteResult = await bulkDeleteOrganizations(apiUrl, token, organizationIds, {
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

// 이름에 "테스트"가 포함된 기관 삭제
const result1 = await deleteOrganizationsByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { namePattern: '테스트' },
  { safeMode: true, createBackup: true }
);

// ID가 10 이상인 기관 삭제
const result2 = await deleteOrganizationsByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { idRange: { min: 10, max: 999 } },
  { safeMode: true }
);

// 사용하지 않는 기관 삭제 (보고서가 0개인 기관)
const result3 = await deleteOrganizationsByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { unusedOnly: true }
);
```

### 6. 기관 삭제 전 의존성 분석

```javascript
async function analyzeOrganizationDependencies(apiUrl, token, organizationIds) {
  const analysis = [];

  console.log(`🔍 ${organizationIds.length}개 기관 의존성 분석 시작`);

  for (const organizationId of organizationIds) {
    try {
      // 기관 정보 조회
      const organization = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());

      // 관련 보고서 조회
      const reportsResponse = await fetch(`${apiUrl}/api/reports/search?organization=${encodeURIComponent(organization.name)}&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let reports = [];
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        reports = reportsData.data || [];
      }

      // 카테고리별 분포
      const categoryDistribution = {};
      reports.forEach(report => {
        categoryDistribution[report.category] = 
          (categoryDistribution[report.category] || 0) + 1;
      });

      // 날짜 범위
      const dates = reports.map(r => new Date(r.date)).sort((a, b) => a - b);
      const dateRange = dates.length > 0 ? {
        earliest: dates[0].toISOString().slice(0, 10),
        latest: dates[dates.length - 1].toISOString().slice(0, 10)
      } : null;

      // 최근 활동
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const recentReports = reports.filter(r => new Date(r.date) >= threeMonthsAgo);

      analysis.push({
        organization: {
          id: organization.id,
          name: organization.name
        },
        dependencies: {
          reportsCount: reports.length,
          canDelete: reports.length === 0,
          categoryDistribution: Object.entries(categoryDistribution)
            .sort(([,a], [,b]) => b - a),
          dateRange,
          recentActivity: {
            count: recentReports.length,
            hasRecentActivity: recentReports.length > 0
          },
          topReports: reports
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map(r => ({ id: r.id, title: r.title, date: r.date })),
          isActive: recentReports.length > 0
        }
      });

      console.log(`  📊 ${organization.name}: ${reports.length}개 보고서 (최근 3개월: ${recentReports.length}개)`);

    } catch (error) {
      analysis.push({
        organization: { id: organizationId },
        error: error.message,
        dependencies: { canDelete: false }
      });
      console.log(`  ❌ ID ${organizationId}: ${error.message}`);
    }

    // API 부하 방지
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 분석 요약
  const deletable = analysis.filter(a => a.dependencies?.canDelete);
  const nonDeletable = analysis.filter(a => !a.dependencies?.canDelete);
  const activeOrganizations = analysis.filter(a => a.dependencies?.isActive);
  const inactiveOrganizations = analysis.filter(a => a.dependencies && !a.dependencies.isActive && a.dependencies.reportsCount > 0);

  console.log(`\n📊 의존성 분석 완료:`);
  console.log(`✅ 삭제 가능: ${deletable.length}개`);
  console.log(`❌ 삭제 불가: ${nonDeletable.length}개`);
  console.log(`🔥 활성 기관: ${activeOrganizations.length}개`);
  console.log(`💤 비활성 기관: ${inactiveOrganizations.length}개`);

  if (nonDeletable.length > 0) {
    console.log(`\n⚠️  삭제 불가 기관:`);
    nonDeletable.forEach(item => {
      if (item.error) {
        console.log(`  - ID ${item.organization.id}: ${item.error}`);
      } else {
        const recentStatus = item.dependencies.isActive ? '활성' : '비활성';
        console.log(`  - ${item.organization.name}: ${item.dependencies.reportsCount}개 보고서 (${recentStatus})`);
      }
    });
  }

  return {
    analysis,
    summary: {
      total: organizationIds.length,
      deletable: deletable.length,
      nonDeletable: nonDeletable.length,
      active: activeOrganizations.length,
      inactive: inactiveOrganizations.length
    },
    recommendations: {
      safeDeletion: deletable.map(a => a.organization.id),
      requiresAction: nonDeletable.map(a => ({
        organizationId: a.organization.id,
        organizationName: a.organization.name,
        reportsCount: a.dependencies?.reportsCount || 0,
        isActive: a.dependencies?.isActive || false,
        error: a.error
      })),
      inactiveButUsed: inactiveOrganizations.map(a => ({
        organizationId: a.organization.id,
        organizationName: a.organization.name,
        reportsCount: a.dependencies.reportsCount,
        lastActivity: a.dependencies.dateRange?.latest
      }))
    }
  };
}

// 사용 예시
const dependencyAnalysis = await analyzeOrganizationDependencies(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
);

console.log('분석 결과:', dependencyAnalysis.summary);
console.log('안전 삭제 가능:', dependencyAnalysis.recommendations.safeDeletion);
console.log('조치 필요:', dependencyAnalysis.recommendations.requiresAction);
console.log('비활성 기관:', dependencyAnalysis.recommendations.inactiveButUsed);

// 안전한 기관만 삭제 실행
if (dependencyAnalysis.recommendations.safeDeletion.length > 0) {
  const safeDeleteResult = await bulkDeleteOrganizations(
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
1. **참조 제약**: 해당 기관을 사용하는 보고서가 있으면 삭제할 수 없습니다
2. **의존성 확인**: 삭제 전 반드시 관련 보고서 존재 여부를 확인하세요
3. **백업 생성**: 중요한 기관 삭제 전 백업을 생성하세요

### 권한 관리
- 기관 삭제는 관리자 권한이 필요합니다
- 시스템 핵심 기관은 삭제하지 마세요

### 복구 불가
- 삭제된 기관은 복구할 수 없습니다
- 안전 모드를 사용하여 신중하게 삭제하세요

이 API를 통해 기관을 안전하고 효율적으로 관리할 수 있습니다.