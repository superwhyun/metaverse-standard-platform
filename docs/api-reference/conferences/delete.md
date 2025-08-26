# 회의 삭제 API

## 개요

기존 회의를 삭제합니다. 해당 회의와 연관된 보고서가 있는 경우 삭제가 제한될 수 있으며, 관리자 권한이 필요합니다.

## 기본 정보

- **HTTP 메서드**: `DELETE`
- **엔드포인트**: `/api/conferences/{id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
DELETE /api/conferences/{id}
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 삭제할 회의 ID | `5` |

### 요청 예시

```bash
curl -X DELETE https://your-domain.com/api/conferences/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true,
  "message": "Conference deleted successfully"
}
```

### 에러 응답

#### 회의 없음 (404)
```json
{
  "success": false,
  "error": "Conference not found or failed to delete"
}
```

#### 참조 제약 위반 (409)
```json
{
  "success": false,
  "error": "Cannot delete conference: reports are still linked to this conference"
}
```

#### 인증 오류 (401)
```json
{
  "success": false,
  "error": "관리자 권한이 필요합니다."
}
```

#### 서버 오류 (500)
```json
{
  "success": false,
  "error": "Failed to delete conference"
}
```

## 실용적인 사용 예시

### 1. 기본 회의 삭제

```javascript
async function deleteConference(apiUrl, token, conferenceId) {
  try {
    const response = await fetch(`${apiUrl}/api/conferences/${conferenceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('회의를 찾을 수 없습니다.');
      }
      if (response.status === 409) {
        throw new Error('이 회의와 연결된 보고서가 있어 삭제할 수 없습니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '회의 삭제에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('회의 삭제 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const deleted = await deleteConference('https://your-domain.com', 'YOUR_JWT_TOKEN', 5);
  console.log('✅ 회의가 성공적으로 삭제되었습니다.');
} catch (error) {
  console.error('❌ 삭제 실패:', error.message);
}
```

### 2. 안전한 회의 삭제

```javascript
async function safeDeleteConference(apiUrl, token, conferenceId) {
  try {
    // 1. 회의 정보 조회
    console.log(`🔍 회의 ID ${conferenceId} 정보 조회 중...`);
    const conferenceResponse = await fetch(`${apiUrl}/api/conferences/${conferenceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!conferenceResponse.ok) {
      if (conferenceResponse.status === 404) {
        throw new Error('삭제하려는 회의를 찾을 수 없습니다.');
      }
      throw new Error('회의 정보 조회에 실패했습니다.');
    }

    const conferenceData = await conferenceResponse.json();
    
    if (!conferenceData.success) {
      throw new Error('회의 정보를 가져올 수 없습니다.');
    }

    const conference = conferenceData.data;

    // 2. 관련 보고서 확인
    console.log('📊 관련 보고서 확인 중...');
    if (conference.hasReport && conference.reports.length > 0) {
      console.log(`⚠️  이 회의와 연결된 ${conference.reports.length}개의 보고서가 있습니다:`);
      conference.reports.forEach(report => {
        console.log(`  - ${report.title} (${report.date})`);
      });
      
      throw new Error(`이 회의와 연결된 ${conference.reports.length}개의 보고서가 있어 삭제할 수 없습니다. 먼저 관련 보고서를 삭제하거나 다른 회의로 이동시켜주세요.`);
    }

    // 3. 삭제 정보 표시
    console.log('🗑️  삭제 예정 회의 정보:');
    console.log(`  ID: ${conference.id}`);
    console.log(`  제목: ${conference.title}`);
    console.log(`  주최: ${conference.organization}`);
    console.log(`  기간: ${conference.startDate} ~ ${conference.endDate}`);
    console.log(`  장소: ${conference.location}`);

    // 4. 회의 상태 확인
    const today = new Date();
    const startDate = new Date(conference.startDate);
    const endDate = new Date(conference.endDate);
    
    if (startDate <= today && today <= endDate) {
      console.warn('⚠️  현재 진행 중인 회의입니다.');
    } else if (startDate > today) {
      console.log('ℹ️  예정된 회의입니다.');
    } else {
      console.log('ℹ️  종료된 회의입니다.');
    }

    // 5. 실제 삭제 실행
    console.log('⏳ 회의 삭제 중...');
    const deleteResult = await deleteConference(apiUrl, token, conferenceId);

    console.log('✅ 회의가 성공적으로 삭제되었습니다.');
    return {
      success: true,
      deletedConference: {
        id: conference.id,
        title: conference.title,
        organization: conference.organization,
        startDate: conference.startDate,
        endDate: conference.endDate
      }
    };

  } catch (error) {
    console.error('❌ 안전 삭제 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 사용 예시
const result = await safeDeleteConference('https://your-domain.com', 'YOUR_JWT_TOKEN', 5);
if (result.success) {
  console.log('삭제된 회의:', result.deletedConference.title);
}
```

### 3. 강제 삭제 (관련 보고서 해제 후 삭제)

```javascript
async function forceDeleteConference(apiUrl, token, conferenceId, options = {}) {
  const { unlinkReports = true, deleteOrphanedReports = false } = options;
  
  try {
    // 1. 회의 정보 조회
    console.log(`🔍 회의 ID ${conferenceId} 정보 조회 중...`);
    const conferenceResponse = await fetch(`${apiUrl}/api/conferences/${conferenceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!conferenceResponse.ok) {
      throw new Error('회의를 찾을 수 없습니다.');
    }

    const conferenceData = await conferenceResponse.json();
    const conference = conferenceData.data;

    console.log(`🔄 "${conference.title}" 회의 강제 삭제 시작`);

    // 2. 관련 보고서 처리
    if (conference.hasReport && conference.reports.length > 0) {
      console.log(`📊 ${conference.reports.length}개 관련 보고서 처리 중...`);
      
      for (const report of conference.reports) {
        try {
          if (deleteOrphanedReports) {
            // 보고서 삭제
            const deleteReportResponse = await fetch(`${apiUrl}/api/reports/${report.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (deleteReportResponse.ok) {
              console.log(`  ✅ 보고서 삭제: ${report.title}`);
            } else {
              console.warn(`  ⚠️  보고서 삭제 실패: ${report.title}`);
            }
          } else if (unlinkReports) {
            // 보고서에서 회의 연결 해제
            const updateReportResponse = await fetch(`${apiUrl}/api/reports/${report.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                conference_id: null
              })
            });
            
            if (updateReportResponse.ok) {
              console.log(`  ✅ 보고서 연결 해제: ${report.title}`);
            } else {
              console.warn(`  ⚠️  보고서 연결 해제 실패: ${report.title}`);
            }
          }
        } catch (error) {
          console.warn(`  ❌ 보고서 처리 오류 (${report.title}):`, error.message);
        }
      }
    }

    // 3. 회의 삭제
    const deleteResult = await safeDeleteConference(apiUrl, token, conferenceId);
    
    return {
      ...deleteResult,
      processedReports: conference.reports.length,
      reportsDeleted: deleteOrphanedReports ? conference.reports.length : 0,
      reportsUnlinked: unlinkReports && !deleteOrphanedReports ? conference.reports.length : 0
    };

  } catch (error) {
    console.error('❌ 강제 삭제 실패:', error);
    throw error;
  }
}

// 사용 예시
const forceResult = await forceDeleteConference(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  5,
  {
    unlinkReports: true,      // 보고서 연결 해제
    deleteOrphanedReports: false  // 보고서는 삭제하지 않음
  }
);

if (forceResult.success) {
  console.log(`✅ 회의 강제 삭제 완료: ${forceResult.deletedConference.title}`);
  console.log(`📊 처리된 보고서: ${forceResult.processedReports}개`);
  if (forceResult.reportsUnlinked > 0) {
    console.log(`🔗 연결 해제된 보고서: ${forceResult.reportsUnlinked}개`);
  }
}
```

### 4. 일괄 회의 삭제

```javascript
async function bulkDeleteConferences(apiUrl, token, conferenceIds, options = {}) {
  const { 
    batchSize = 3, 
    delay = 1500,
    safeMode = true,
    createBackup = false 
  } = options;
  
  const results = [];
  const backup = [];

  console.log(`🗑️  ${conferenceIds.length}개 회의 일괄 삭제 시작`);
  console.log(`배치 크기: ${batchSize}, 지연시간: ${delay}ms, 안전모드: ${safeMode}`);

  // 배치 단위로 처리
  for (let i = 0; i < conferenceIds.length; i += batchSize) {
    const batch = conferenceIds.slice(i, i + batchSize);
    console.log(`\n📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (const conferenceId of batch) {
      try {
        let conferenceInfo = null;

        // 백업 생성 또는 안전모드
        if (safeMode || createBackup) {
          const conferenceResponse = await fetch(`${apiUrl}/api/conferences/${conferenceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (conferenceResponse.ok) {
            const conferenceData = await conferenceResponse.json();
            if (conferenceData.success) {
              conferenceInfo = conferenceData.data;
              
              if (createBackup) {
                backup.push(conferenceInfo);
              }
            }
          }
        }

        // 삭제 실행
        let deleteResult;
        if (safeMode) {
          deleteResult = await safeDeleteConference(apiUrl, token, conferenceId);
        } else {
          const deleted = await deleteConference(apiUrl, token, conferenceId);
          deleteResult = { success: true };
        }

        if (deleteResult.success) {
          results.push({
            success: true,
            id: conferenceId,
            title: conferenceInfo?.title || `ID ${conferenceId}`,
            deletedAt: new Date().toISOString()
          });
          console.log(`  ✅ 삭제 성공: ${conferenceInfo?.title || `ID ${conferenceId}`}`);
        } else {
          results.push({
            success: false,
            id: conferenceId,
            error: deleteResult.error
          });
          console.log(`  ❌ 삭제 실패: ID ${conferenceId} - ${deleteResult.error}`);
        }

        // 요청 간 지연
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.push({
          success: false,
          id: conferenceId,
          error: error.message
        });
        console.log(`  ❌ 오류: ID ${conferenceId} - ${error.message}`);
      }
    }

    // 배치 간 지연
    if (i + batchSize < conferenceIds.length) {
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
    const backupFilename = `deleted-conferences-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    require('fs').writeFileSync(backupFilename, JSON.stringify(backup, null, 2));
    console.log(`💾 백업 파일 생성: ${backupFilename}`);
  }

  return { results, backup, summary: { successful: successful.length, failed: failed.length } };
}

// 사용 예시
const conferenceIdsToDelete = [5, 6, 7, 8];

const deleteResult = await bulkDeleteConferences(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  conferenceIdsToDelete,
  {
    batchSize: 2,
    delay: 2000,
    safeMode: true,
    createBackup: true
  }
);

console.log('삭제 요약:', deleteResult.summary);
```

### 5. 조건부 회의 삭제

```javascript
async function deleteConferencesByCondition(apiUrl, token, condition, options = {}) {
  const { safeMode = true, createBackup = true } = options;

  try {
    // 1. 모든 회의 조회
    console.log('🔍 조건에 맞는 회의 검색 중...');
    const conferencesResponse = await fetch(`${apiUrl}/api/conferences`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!conferencesResponse.ok) {
      throw new Error('회의 목록 조회 실패');
    }

    const allConferences = await conferencesResponse.json();
    
    // 상세 정보가 필요한 경우 개별 조회
    const detailedConferences = await Promise.all(
      allConferences.map(async (conf) => {
        try {
          const detailResponse = await fetch(`${apiUrl}/api/conferences/${conf.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            return detailData.success ? detailData.data : null;
          }
          return null;
        } catch (error) {
          console.warn(`회의 ID ${conf.id} 상세 조회 실패:`, error.message);
          return null;
        }
      })
    );

    const validConferences = detailedConferences.filter(conf => conf !== null);

    // 2. 조건 필터링
    const toDelete = validConferences.filter(conference => {
      // 날짜 범위
      if (condition.dateRange) {
        const confEndDate = new Date(conference.endDate);
        const rangeStart = new Date(condition.dateRange.start);
        const rangeEnd = new Date(condition.dateRange.end);
        
        if (confEndDate < rangeStart || confEndDate > rangeEnd) return false;
      }
      
      // 기관 필터
      if (condition.organization) {
        if (conference.organization !== condition.organization) return false;
      }
      
      // 장소 패턴
      if (condition.locationPattern) {
        const regex = new RegExp(condition.locationPattern, 'i');
        if (!regex.test(conference.location)) return false;
      }
      
      // 보고서가 없는 회의만
      if (condition.noReports) {
        if (conference.hasReport) return false;
      }
      
      // 종료된 회의만
      if (condition.endedOnly) {
        const today = new Date();
        const endDate = new Date(conference.endDate);
        if (endDate >= today) return false;
      }
      
      // 취소된 회의 (제목에 "취소" 포함)
      if (condition.cancelled) {
        if (!conference.title.includes('취소') && !conference.description?.includes('취소')) {
          return false;
        }
      }
      
      return true;
    });

    if (toDelete.length === 0) {
      console.log('조건에 맞는 회의가 없습니다.');
      return { deleted: [], total: 0 };
    }

    // 3. 삭제 예정 목록 표시
    console.log(`\n📋 삭제 예정 회의 (${toDelete.length}개):`);
    toDelete.forEach((conference, index) => {
      console.log(`  ${index + 1}. ${conference.title} (${conference.startDate} ~ ${conference.endDate}, ${conference.organization})`);
    });

    // 4. 일괄 삭제 실행
    const conferenceIds = toDelete.map(c => c.id);
    const deleteResult = await bulkDeleteConferences(apiUrl, token, conferenceIds, {
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

// 2023년에 종료된 보고서가 없는 회의 삭제
const result1 = await deleteConferencesByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { 
    dateRange: { start: '2023-01-01', end: '2023-12-31' },
    noReports: true,
    endedOnly: true 
  },
  { safeMode: true, createBackup: true }
);

// 온라인 회의 중 취소된 것들 삭제
const result2 = await deleteConferencesByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { 
    locationPattern: 'virtual|online',
    cancelled: true 
  }
);

// 특정 기관의 종료된 회의 삭제
const result3 = await deleteConferencesByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { 
    organization: 'ITU',
    endedOnly: true 
  }
);
```

### 6. 회의 삭제 전 의존성 분석

```javascript
async function analyzeConferenceDependencies(apiUrl, token, conferenceIds) {
  const analysis = [];

  console.log(`🔍 ${conferenceIds.length}개 회의 의존성 분석 시작`);

  for (const conferenceId of conferenceIds) {
    try {
      // 회의 정보 조회
      const conferenceResponse = await fetch(`${apiUrl}/api/conferences/${conferenceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!conferenceResponse.ok) {
        analysis.push({
          conference: { id: conferenceId },
          error: '회의를 찾을 수 없습니다.',
          dependencies: { canDelete: false }
        });
        continue;
      }

      const conferenceData = await conferenceResponse.json();
      const conference = conferenceData.data;

      // 관련 보고서 분석
      const reports = conference.reports || [];
      
      // 회의 상태 확인
      const today = new Date();
      const startDate = new Date(conference.startDate);
      const endDate = new Date(conference.endDate);
      
      let status;
      if (today < startDate) {
        status = 'upcoming';
      } else if (today >= startDate && today <= endDate) {
        status = 'ongoing';
      } else {
        status = 'ended';
      }

      analysis.push({
        conference: {
          id: conference.id,
          title: conference.title,
          organization: conference.organization,
          startDate: conference.startDate,
          endDate: conference.endDate,
          status
        },
        dependencies: {
          reportsCount: reports.length,
          canDelete: reports.length === 0,
          hasLinkedReports: reports.length > 0,
          reports: reports.map(r => ({ 
            id: r.id, 
            title: r.title, 
            date: r.date 
          })),
          isOngoing: status === 'ongoing',
          isUpcoming: status === 'upcoming',
          riskLevel: this.calculateRiskLevel(status, reports.length)
        }
      });

      const riskEmoji = this.getRiskEmoji(analysis[analysis.length - 1].dependencies.riskLevel);
      console.log(`  ${riskEmoji} ${conference.title}: ${reports.length}개 보고서, 상태: ${status}`);

    } catch (error) {
      analysis.push({
        conference: { id: conferenceId },
        error: error.message,
        dependencies: { canDelete: false }
      });
      console.log(`  ❌ ID ${conferenceId}: ${error.message}`);
    }

    // API 부하 방지
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 분석 요약
  const deletable = analysis.filter(a => a.dependencies?.canDelete);
  const nonDeletable = analysis.filter(a => !a.dependencies?.canDelete);
  const ongoing = analysis.filter(a => a.dependencies?.isOngoing);
  const upcoming = analysis.filter(a => a.dependencies?.isUpcoming);

  console.log(`\n📊 의존성 분석 완료:`);
  console.log(`✅ 삭제 가능: ${deletable.length}개`);
  console.log(`❌ 삭제 불가: ${nonDeletable.length}개`);
  console.log(`🔄 진행 중: ${ongoing.length}개`);
  console.log(`⏰ 예정: ${upcoming.length}개`);

  if (nonDeletable.length > 0) {
    console.log(`\n⚠️  삭제 불가 회의:`);
    nonDeletable.forEach(item => {
      if (item.error) {
        console.log(`  - ID ${item.conference.id}: ${item.error}`);
      } else {
        const conf = item.conference;
        const deps = item.dependencies;
        console.log(`  - ${conf.title}: ${deps.reportsCount}개 보고서, 상태: ${conf.status}`);
      }
    });
  }

  return {
    analysis,
    summary: {
      total: conferenceIds.length,
      deletable: deletable.length,
      nonDeletable: nonDeletable.length,
      ongoing: ongoing.length,
      upcoming: upcoming.length
    },
    recommendations: {
      safeDeletion: deletable.map(a => a.conference.id),
      requiresAction: nonDeletable.map(a => ({
        conferenceId: a.conference.id,
        conferenceTitle: a.conference.title,
        reportsCount: a.dependencies?.reportsCount || 0,
        status: a.conference.status,
        riskLevel: a.dependencies?.riskLevel,
        error: a.error
      }))
    }
  };
}

// 헬퍼 함수들
function calculateRiskLevel(status, reportsCount) {
  if (status === 'ongoing') return 'high';
  if (status === 'upcoming' && reportsCount > 0) return 'high';
  if (reportsCount > 5) return 'medium';
  if (reportsCount > 0) return 'low';
  return 'none';
}

function getRiskEmoji(riskLevel) {
  const emojis = {
    'high': '🚨',
    'medium': '⚠️',
    'low': '🔶',
    'none': '✅'
  };
  return emojis[riskLevel] || '❓';
}

// 사용 예시
const dependencyAnalysis = await analyzeConferenceDependencies(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
);

console.log('분석 결과:', dependencyAnalysis.summary);
console.log('안전 삭제 가능:', dependencyAnalysis.recommendations.safeDeletion);
console.log('조치 필요:', dependencyAnalysis.recommendations.requiresAction);

// 안전한 회의만 삭제 실행
if (dependencyAnalysis.recommendations.safeDeletion.length > 0) {
  const safeDeleteResult = await bulkDeleteConferences(
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
1. **참조 제약**: 해당 회의와 연결된 보고서가 있으면 삭제할 수 없습니다
2. **의존성 확인**: 삭제 전 반드시 관련 보고서 존재 여부를 확인하세요
3. **백업 생성**: 중요한 회의 삭제 전 백업을 생성하세요

### 권한 관리
- 회의 삭제는 관리자 권한이 필요합니다
- 진행 중이거나 예정된 중요 회의는 신중하게 처리하세요

### 복구 불가
- 삭제된 회의는 복구할 수 없습니다
- 안전 모드를 사용하여 신중하게 삭제하세요

이 API를 통해 회의를 안전하고 효율적으로 관리할 수 있습니다.