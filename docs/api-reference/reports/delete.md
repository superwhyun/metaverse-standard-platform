# 보고서 삭제 API

## 개요

기존 보고서를 완전히 삭제합니다. 삭제된 보고서는 복구할 수 없으므로 신중하게 사용해야 합니다.

## 기본 정보

- **HTTP 메서드**: `DELETE`
- **엔드포인트**: `/api/reports/{id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
DELETE /api/reports/{id}
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 삭제할 보고서 ID | `456` |

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true
}
```

### 에러 응답

#### 인증 오류 (401)
```json
{
  "success": false,
  "error": "관리자 권한이 필요합니다."
}
```

#### 잘못된 ID (400)
```json
{
  "success": false,
  "error": "Invalid report ID"
}
```

#### 보고서 없음 (404)
```json
{
  "success": false,
  "error": "Report not found"
}
```

#### 서버 오류 (500)
```json
{
  "success": false,
  "error": "Failed to delete report"
}
```

## 실용적인 사용 예시

### 1. 단일 보고서 삭제

```bash
curl -X DELETE https://your-domain.com/api/reports/456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. JavaScript로 보고서 삭제

```javascript
async function deleteReport(apiUrl, token, reportId) {
  try {
    const response = await fetch(`${apiUrl}/api/reports/${reportId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('보고서를 찾을 수 없습니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('보고서 삭제 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const deleted = await deleteReport('https://your-domain.com', 'YOUR_JWT_TOKEN', 456);
  if (deleted) {
    console.log('✅ 보고서가 성공적으로 삭제되었습니다.');
  }
} catch (error) {
  console.error('❌ 삭제 실패:', error.message);
}
```

### 3. 안전한 삭제 (확인 후 삭제)

```javascript
async function safeDeleteReport(apiUrl, token, reportId) {
  try {
    // 1. 먼저 보고서 정보를 조회하여 존재 확인
    console.log(`🔍 보고서 ID ${reportId} 조회 중...`);
    const reportResponse = await fetch(`${apiUrl}/api/reports/${reportId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!reportResponse.ok) {
      if (reportResponse.status === 404) {
        throw new Error('삭제하려는 보고서를 찾을 수 없습니다.');
      }
      throw new Error('보고서 조회에 실패했습니다.');
    }

    const reportData = await reportResponse.json();
    const report = reportData.data;

    // 2. 삭제 확인 정보 표시
    console.log('📋 삭제 예정 보고서 정보:');
    console.log(`  제목: ${report.title}`);
    console.log(`  날짜: ${report.date}`);
    console.log(`  기관: ${report.organization}`);
    console.log(`  카테고리: ${report.category}`);

    // 3. 실제 삭제 실행
    console.log('🗑️  보고서 삭제 중...');
    const deleteResponse = await fetch(`${apiUrl}/api/reports/${reportId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!deleteResponse.ok) {
      throw new Error('보고서 삭제에 실패했습니다.');
    }

    console.log('✅ 보고서가 성공적으로 삭제되었습니다.');
    return {
      success: true,
      deletedReport: {
        id: report.id,
        title: report.title,
        date: report.date
      }
    };

  } catch (error) {
    console.error('❌ 안전 삭제 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 사용 예시
const result = await safeDeleteReport('https://your-domain.com', 'YOUR_JWT_TOKEN', 456);
if (result.success) {
  console.log('삭제된 보고서:', result.deletedReport.title);
}
```

### 4. 일괄 보고서 삭제

```javascript
async function bulkDeleteReports(apiUrl, token, reportIds, options = {}) {
  const { 
    batchSize = 5, 
    delay = 1000,
    safeMode = true,
    createBackup = false 
  } = options;
  
  const results = [];
  const backup = [];

  console.log(`🗑️  ${reportIds.length}개 보고서 일괄 삭제 시작`);
  console.log(`배치 크기: ${batchSize}, 지연시간: ${delay}ms, 안전모드: ${safeMode}`);

  // 배치 단위로 처리
  for (let i = 0; i < reportIds.length; i += batchSize) {
    const batch = reportIds.slice(i, i + batchSize);
    console.log(`\n📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (const reportId of batch) {
      try {
        let reportInfo = null;

        // 안전 모드: 삭제 전 정보 백업
        if (safeMode || createBackup) {
          const reportResponse = await fetch(`${apiUrl}/api/reports/${reportId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            reportInfo = reportData.data;
            
            if (createBackup) {
              backup.push(reportInfo);
            }
          }
        }

        // 삭제 실행
        const deleteResponse = await fetch(`${apiUrl}/api/reports/${reportId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (deleteResponse.ok) {
          results.push({
            success: true,
            id: reportId,
            title: reportInfo?.title || `ID ${reportId}`,
            deletedAt: new Date().toISOString()
          });
          console.log(`  ✅ 삭제 성공: ${reportInfo?.title || `ID ${reportId}`}`);
        } else {
          const error = await deleteResponse.text();
          results.push({
            success: false,
            id: reportId,
            error
          });
          console.log(`  ❌ 삭제 실패: ID ${reportId} - ${error}`);
        }

        // 요청 간 지연
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.push({
          success: false,
          id: reportId,
          error: error.message
        });
        console.log(`  ❌ 오류: ID ${reportId} - ${error.message}`);
      }
    }

    // 배치 간 지연
    if (i + batchSize < reportIds.length) {
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
    const backupFilename = `deleted-reports-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    require('fs').writeFileSync(backupFilename, JSON.stringify(backup, null, 2));
    console.log(`💾 백업 파일 생성: ${backupFilename}`);
  }

  return { results, backup, summary: { successful: successful.length, failed: failed.length } };
}

// 사용 예시
const reportIdsToDelete = [456, 457, 458, 459];

const deleteResult = await bulkDeleteReports(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  reportIdsToDelete,
  {
    batchSize: 3,
    delay: 1500,
    safeMode: true,
    createBackup: true
  }
);

console.log('삭제 요약:', deleteResult.summary);
```

### 5. 조건부 삭제

```javascript
async function deleteReportsByCondition(apiUrl, token, condition) {
  try {
    // 1. 조건에 맞는 보고서 목록 조회
    console.log('🔍 조건에 맞는 보고서 검색 중...');
    const reportsResponse = await fetch(`${apiUrl}/api/reports`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!reportsResponse.ok) {
      throw new Error('보고서 목록 조회 실패');
    }

    const reportsData = await reportsResponse.json();
    const allReports = reportsData.data;

    // 2. 조건 필터링
    const toDelete = allReports.filter(report => {
      if (condition.organization && report.organization !== condition.organization) return false;
      if (condition.category && report.category !== condition.category) return false;
      if (condition.dateRange) {
        const reportDate = new Date(report.date);
        const startDate = new Date(condition.dateRange.start);
        const endDate = new Date(condition.dateRange.end);
        if (reportDate < startDate || reportDate > endDate) return false;
      }
      if (condition.tags && condition.tags.length > 0) {
        const hasRequiredTag = condition.tags.some(tag => 
          report.tags && report.tags.includes(tag)
        );
        if (!hasRequiredTag) return false;
      }
      return true;
    });

    if (toDelete.length === 0) {
      console.log('조건에 맞는 보고서가 없습니다.');
      return { deleted: [], total: 0 };
    }

    // 3. 삭제 예정 목록 표시
    console.log(`\n📋 삭제 예정 보고서 (${toDelete.length}개):`);
    toDelete.forEach((report, index) => {
      console.log(`  ${index + 1}. ${report.title} (${report.date}, ${report.organization})`);
    });

    // 4. 일괄 삭제 실행
    const reportIds = toDelete.map(r => r.id);
    const deleteResult = await bulkDeleteReports(apiUrl, token, reportIds, {
      safeMode: true,
      createBackup: true
    });

    return {
      deleted: deleteResult.results.filter(r => r.success),
      failed: deleteResult.results.filter(r => !r.success),
      total: toDelete.length
    };

  } catch (error) {
    console.error('❌ 조건부 삭제 실패:', error.message);
    throw error;
  }
}

// 사용 예시들

// 특정 기관의 모든 보고서 삭제
const result1 = await deleteReportsByCondition('https://your-domain.com', 'YOUR_JWT_TOKEN', {
  organization: 'ITU'
});

// 특정 기간의 보고서 삭제
const result2 = await deleteReportsByCondition('https://your-domain.com', 'YOUR_JWT_TOKEN', {
  dateRange: {
    start: '2024-01-01',
    end: '2024-03-31'
  }
});

// 특정 태그가 있는 보고서 삭제
const result3 = await deleteReportsByCondition('https://your-domain.com', 'YOUR_JWT_TOKEN', {
  tags: ['테스트', '임시']
});

// 복합 조건
const result4 = await deleteReportsByCondition('https://your-domain.com', 'YOUR_JWT_TOKEN', {
  organization: 'ETRI',
  category: '기술동향',
  dateRange: {
    start: '2024-08-01',
    end: '2024-08-31'
  }
});
```

### 6. 삭제 취소 (휴지통 기능 시뮬레이션)

실제 API는 완전 삭제이지만, 애플리케이션 레벨에서 휴지통 기능을 구현할 수 있습니다:

```javascript
class ReportTrashManager {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.trashBackups = []; // 메모리에 임시 저장 (실제로는 별도 저장소 사용 권장)
  }

  async softDelete(reportId) {
    try {
      // 1. 보고서 백업
      const reportResponse = await fetch(`${this.apiUrl}/api/reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!reportResponse.ok) {
        throw new Error('보고서 조회 실패');
      }

      const reportData = await reportResponse.json();
      const backup = {
        ...reportData.data,
        deletedAt: new Date().toISOString(),
        restorable: true
      };

      // 2. 실제 삭제
      const deleteResponse = await fetch(`${this.apiUrl}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!deleteResponse.ok) {
        throw new Error('보고서 삭제 실패');
      }

      // 3. 휴지통에 추가
      this.trashBackups.push(backup);
      console.log(`🗑️  보고서를 휴지통으로 이동: ${backup.title}`);

      return { success: true, backup };

    } catch (error) {
      console.error('❌ 소프트 삭제 실패:', error.message);
      return { success: false, error: error.message };
    }
  }

  async restore(reportId) {
    const backupIndex = this.trashBackups.findIndex(b => b.id === reportId && b.restorable);
    
    if (backupIndex === -1) {
      throw new Error('복원할 보고서 백업을 찾을 수 없습니다.');
    }

    const backup = this.trashBackups[backupIndex];

    try {
      // 보고서 재생성
      const { id, createdAt, updatedAt, deletedAt, restorable, ...reportData } = backup;
      
      const restoreResponse = await fetch(`${this.apiUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(reportData)
      });

      if (!restoreResponse.ok) {
        throw new Error('보고서 복원 실패');
      }

      const restoredData = await restoreResponse.json();
      
      // 휴지통에서 제거
      this.trashBackups.splice(backupIndex, 1);
      
      console.log(`♻️  보고서 복원 완료: ${backup.title} (새 ID: ${restoredData.data.id})`);
      return { success: true, restored: restoredData.data, originalId: reportId };

    } catch (error) {
      console.error('❌ 복원 실패:', error.message);
      throw error;
    }
  }

  getTrashItems() {
    return this.trashBackups.filter(b => b.restorable);
  }

  permanentDelete(reportId) {
    const backupIndex = this.trashBackups.findIndex(b => b.id === reportId);
    if (backupIndex !== -1) {
      const deleted = this.trashBackups.splice(backupIndex, 1)[0];
      console.log(`🔥 영구 삭제: ${deleted.title}`);
      return true;
    }
    return false;
  }

  emptyTrash() {
    const count = this.trashBackups.length;
    this.trashBackups = [];
    console.log(`🗑️  휴지통 비우기: ${count}개 항목 영구 삭제`);
    return count;
  }
}

// 사용 예시
const trashManager = new ReportTrashManager('https://your-domain.com', 'YOUR_JWT_TOKEN');

// 소프트 삭제
await trashManager.softDelete(456);

// 휴지통 목록 조회
const trashItems = trashManager.getTrashItems();
console.log('휴지통 항목:', trashItems.map(item => ({ id: item.id, title: item.title })));

// 복원
await trashManager.restore(456);

// 휴지통 비우기
trashManager.emptyTrash();
```

## ⚠️ 중요 주의사항

### 데이터 손실 방지
1. **백업 필수**: 중요한 보고서 삭제 전 반드시 백업을 생성하세요
2. **확인 절차**: 삭제 전 보고서 정보를 확인하는 절차를 구현하세요
3. **로그 기록**: 모든 삭제 작업을 로그로 기록하세요

### 참조 무결성
- 다른 데이터(회의 등)에서 참조하고 있는 보고서 삭제 시 주의가 필요합니다
- 삭제 전 참조 관계를 확인하는 것을 권장합니다

### 권한 관리
- 삭제 권한은 반드시 관리자로 제한됩니다
- 중요한 삭제 작업은 추가적인 승인 절차를 구현하는 것을 권장합니다

이 API를 통해 보고서를 안전하고 효율적으로 관리할 수 있습니다.