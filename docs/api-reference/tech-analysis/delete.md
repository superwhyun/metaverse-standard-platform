# 기술 분석 보고서 삭제 API

## 개요

기존 기술 분석 보고서를 삭제합니다. 삭제된 보고서는 복구할 수 없으며, 관리자 권한이 필요합니다.

## 기본 정보

- **HTTP 메서드**: `DELETE`
- **엔드포인트**: `/api/tech-analysis?id={id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
DELETE /api/tech-analysis?id={id}
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 삭제할 보고서 ID | `5` |

### 요청 예시

```bash
curl -X DELETE https://your-domain.com/api/tech-analysis?id=5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "message": "기술 소식이 성공적으로 삭제되었습니다."
}
```

### 에러 응답

#### 보고서 없음 (404)
```json
{
  "message": "해당 기술 소식을 찾을 수 없습니다."
}
```

#### ID 누락 (400)
```json
{
  "message": "ID가 필요합니다."
}
```

#### 잘못된 ID (400)
```json
{
  "message": "유효하지 않은 ID입니다."
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
  "message": "기술 소식 삭제에 실패했습니다."
}
```

## 실용적인 사용 예시

### 1. 기본 보고서 삭제

```javascript
async function deleteTechAnalysisReport(apiUrl, token, reportId) {
  try {
    const response = await fetch(`${apiUrl}/api/tech-analysis?id=${reportId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('보고서를 찾을 수 없습니다.');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || '잘못된 요청입니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('보고서 삭제 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const deleted = await deleteTechAnalysisReport('https://your-domain.com', 'YOUR_JWT_TOKEN', 5);
  console.log('✅ 보고서가 성공적으로 삭제되었습니다.');
} catch (error) {
  console.error('❌ 삭제 실패:', error.message);
}
```

### 2. 안전한 보고서 삭제

```javascript
async function safeDeleteTechReport(apiUrl, token, reportId) {
  try {
    // 1. 보고서 정보 조회
    console.log(`🔍 보고서 ID ${reportId} 정보 조회 중...`);
    const reportsResponse = await fetch(`${apiUrl}/api/tech-analysis?limit=1000`);
    const reportsData = await reportsResponse.json();
    const report = reportsData.data.find(r => r.id === reportId);

    if (!report) {
      throw new Error('삭제하려는 보고서를 찾을 수 없습니다.');
    }

    // 2. 삭제 정보 표시
    console.log('🗑️  삭제 예정 보고서 정보:');
    console.log(`  ID: ${report.id}`);
    console.log(`  제목: ${report.title}`);
    console.log(`  카테고리: ${report.category_name || '기타'}`);
    console.log(`  상태: ${report.status}`);
    console.log(`  생성일: ${report.created_at}`);
    console.log(`  URL: ${report.url}`);

    // 3. 보고서 상태 확인
    if (report.status === 'pending') {
      console.warn('⚠️  아직 처리 중인 보고서입니다.');
    } else if (report.status === 'failed') {
      console.log('ℹ️  처리에 실패한 보고서입니다.');
    } else {
      console.log('ℹ️  완료된 보고서입니다.');
    }

    // 4. 생성일 확인
    const createdDate = new Date(report.created_at);
    const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreation < 7) {
      console.warn(`⚠️  최근 ${daysSinceCreation}일 전에 생성된 보고서입니다.`);
    }

    // 5. 실제 삭제 실행
    console.log('⏳ 보고서 삭제 중...');
    const deleteResult = await deleteTechAnalysisReport(apiUrl, token, reportId);

    console.log('✅ 보고서가 성공적으로 삭제되었습니다.');
    return {
      success: true,
      deletedReport: {
        id: report.id,
        title: report.title,
        category: report.category_name,
        createdAt: report.created_at,
        status: report.status
      }
    };

  } catch (error) {
    console.error('❌ 안전 삭제 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 사용 예시
const result = await safeDeleteTechReport('https://your-domain.com', 'YOUR_JWT_TOKEN', 5);
if (result.success) {
  console.log('삭제된 보고서:', result.deletedReport.title);
}
```

### 3. 일괄 보고서 삭제

```javascript
async function bulkDeleteTechReports(apiUrl, token, reportIds, options = {}) {
  const { 
    batchSize = 3, 
    delay = 1500,
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

        // 백업 생성 또는 안전모드
        if (safeMode || createBackup) {
          const reportsResponse = await fetch(`${apiUrl}/api/tech-analysis?limit=1000`);
          const reportsData = await reportsResponse.json();
          reportInfo = reportsData.data.find(r => r.id === reportId);

          if (reportInfo && createBackup) {
            backup.push(reportInfo);
          }
        }

        // 삭제 실행
        let deleteResult;
        if (safeMode) {
          deleteResult = await safeDeleteTechReport(apiUrl, token, reportId);
        } else {
          const deleted = await deleteTechAnalysisReport(apiUrl, token, reportId);
          deleteResult = { success: true };
        }

        if (deleteResult.success) {
          results.push({
            success: true,
            id: reportId,
            title: reportInfo?.title || `ID ${reportId}`,
            deletedAt: new Date().toISOString()
          });
          console.log(`  ✅ 삭제 성공: ${reportInfo?.title || `ID ${reportId}`}`);
        } else {
          results.push({
            success: false,
            id: reportId,
            error: deleteResult.error
          });
          console.log(`  ❌ 삭제 실패: ID ${reportId} - ${deleteResult.error}`);
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
    const backupFilename = `deleted-tech-reports-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    if (typeof require !== 'undefined') {
      require('fs').writeFileSync(backupFilename, JSON.stringify(backup, null, 2));
      console.log(`💾 백업 파일 생성: ${backupFilename}`);
    }
  }

  return { results, backup, summary: { successful: successful.length, failed: failed.length } };
}

// 사용 예시
const reportIdsToDelete = [5, 6, 7, 8];

const deleteResult = await bulkDeleteTechReports(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  reportIdsToDelete,
  {
    batchSize: 2,
    delay: 2000,
    safeMode: true,
    createBackup: true
  }
);

console.log('삭제 요약:', deleteResult.summary);
```

### 4. 조건부 보고서 삭제

```javascript
async function deleteTechReportsByCondition(apiUrl, token, condition, options = {}) {
  const { safeMode = true, createBackup = true, maxDelete = 50 } = options;

  try {
    // 1. 모든 보고서 조회
    console.log('🔍 조건에 맞는 보고서 검색 중...');
    const reportsResponse = await fetch(`${apiUrl}/api/tech-analysis?limit=1000`);
    const allReports = await reportsResponse.json();
    
    if (!allReports.data) {
      throw new Error('보고서 목록 조회 실패');
    }

    // 2. 조건 필터링
    const toDelete = allReports.data.filter(report => {
      // 상태 필터
      if (condition.status && Array.isArray(condition.status)) {
        if (!condition.status.includes(report.status)) return false;
      }
      
      // 카테고리 필터
      if (condition.category) {
        if (report.category_name !== condition.category) return false;
      }
      
      // 날짜 범위
      if (condition.dateRange) {
        const reportDate = new Date(report.created_at);
        const rangeStart = new Date(condition.dateRange.start);
        const rangeEnd = new Date(condition.dateRange.end);
        
        if (reportDate < rangeStart || reportDate > rangeEnd) return false;
      }
      
      // URL 패턴 (정규식)
      if (condition.urlPattern) {
        const regex = new RegExp(condition.urlPattern, 'i');
        if (!regex.test(report.url)) return false;
      }
      
      // 제목 패턴
      if (condition.titlePattern) {
        const regex = new RegExp(condition.titlePattern, 'i');
        if (!regex.test(report.title)) return false;
      }
      
      // 처리 실패한 보고서
      if (condition.failedOnly) {
        if (report.status !== 'failed') return false;
      }
      
      // 오래된 보고서 (일 단위)
      if (condition.olderThanDays) {
        const createdDate = new Date(report.created_at);
        const daysSince = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince < condition.olderThanDays) return false;
      }
      
      // 중복 URL (같은 URL을 가진 보고서 중 최신 것만 남기고 삭제)
      if (condition.duplicateUrls) {
        const urlReports = allReports.data.filter(r => r.url === report.url);
        if (urlReports.length <= 1) return false; // 중복이 아님
        
        // 같은 URL 중에서 가장 최신 것만 남기고 나머지 삭제
        const latest = urlReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        return report.id !== latest.id;
      }
      
      return true;
    }).slice(0, maxDelete); // 최대 삭제 개수 제한

    if (toDelete.length === 0) {
      console.log('조건에 맞는 보고서가 없습니다.');
      return { deleted: [], total: 0 };
    }

    // 3. 삭제 예정 목록 표시
    console.log(`\n📋 삭제 예정 보고서 (${toDelete.length}개):`);
    toDelete.forEach((report, index) => {
      console.log(`  ${index + 1}. ${report.title} (${report.status}, ${report.created_at.split('T')[0]})`);
    });

    // 4. 일괄 삭제 실행
    const reportIds = toDelete.map(r => r.id);
    const deleteResult = await bulkDeleteTechReports(apiUrl, token, reportIds, {
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

// 실패한 보고서 모두 삭제
const result1 = await deleteTechReportsByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { 
    failedOnly: true 
  },
  { safeMode: true, createBackup: true }
);

// 30일 이상 된 pending 상태 보고서 삭제
const result2 = await deleteTechReportsByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { 
    status: ['pending'],
    olderThanDays: 30 
  }
);

// 중복 URL 보고서 정리 (최신 것만 남기고 삭제)
const result3 = await deleteTechReportsByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { 
    duplicateUrls: true 
  },
  { maxDelete: 100 }
);

// 특정 기간의 특정 카테고리 보고서 삭제
const result4 = await deleteTechReportsByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { 
    category: '테스트',
    dateRange: { start: '2024-01-01', end: '2024-06-30' }
  }
);

// 제목에 '테스트' 포함된 보고서 삭제
const result5 = await deleteTechReportsByCondition(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  { 
    titlePattern: '테스트|test' 
  }
);
```

### 5. 보고서 삭제 전 의존성 분석

```javascript
async function analyzeTechReportDependencies(apiUrl, token, reportIds) {
  const analysis = [];

  console.log(`🔍 ${reportIds.length}개 보고서 의존성 분석 시작`);

  // 모든 보고서 조회
  const reportsResponse = await fetch(`${apiUrl}/api/tech-analysis?limit=1000`);
  const allReports = await reportsResponse.json();
  const reportsMap = new Map(allReports.data.map(r => [r.id, r]));

  for (const reportId of reportIds) {
    try {
      const report = reportsMap.get(reportId);
      
      if (!report) {
        analysis.push({
          report: { id: reportId },
          error: '보고서를 찾을 수 없습니다.',
          canDelete: false
        });
        continue;
      }

      // URL 중복 확인
      const duplicateUrls = allReports.data.filter(r => r.url === report.url && r.id !== report.id);
      
      // 카테고리 내 유일성 확인
      const sameCategory = report.category_name ? 
        allReports.data.filter(r => r.category_name === report.category_name) : [];
      
      // 생성일 기준 분석
      const createdDate = new Date(report.created_at);
      const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // 상태별 위험도 계산
      let riskLevel = 'low';
      if (report.status === 'pending') {
        riskLevel = 'medium';
      } else if (report.status === 'completed' && daysSinceCreation < 7) {
        riskLevel = 'medium';
      } else if (report.status === 'failed') {
        riskLevel = 'low';
      }

      analysis.push({
        report: {
          id: report.id,
          title: report.title,
          status: report.status,
          category: report.category_name,
          createdAt: report.created_at,
          url: report.url
        },
        dependencies: {
          hasDuplicateUrls: duplicateUrls.length > 0,
          duplicateUrls: duplicateUrls.map(r => ({ id: r.id, title: r.title })),
          categoryCount: sameCategory.length,
          daysSinceCreation,
          riskLevel,
          isRecent: daysSinceCreation < 7,
          isPending: report.status === 'pending',
          isFailed: report.status === 'failed'
        },
        canDelete: true, // 기술 분석 보고서는 일반적으로 의존성이 없어 삭제 가능
        recommendations: []
      });

      // 권장사항 추가
      const item = analysis[analysis.length - 1];
      if (item.dependencies.hasDuplicateUrls) {
        item.recommendations.push('중복 URL이 있습니다. 다른 보고서와 비교 검토 필요');
      }
      if (item.dependencies.isRecent && report.status === 'completed') {
        item.recommendations.push('최근 생성된 완료 보고서입니다. 삭제 전 검토 권장');
      }
      if (item.dependencies.isPending) {
        item.recommendations.push('처리 중인 보고서입니다. 완료 대기 후 삭제 권장');
      }

      const riskEmoji = getRiskEmoji(riskLevel);
      console.log(`  ${riskEmoji} ${report.title}: ${report.status}, ${daysSinceCreation}일 전`);

    } catch (error) {
      analysis.push({
        report: { id: reportId },
        error: error.message,
        canDelete: false
      });
      console.log(`  ❌ ID ${reportId}: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 분석 요약
  const deletable = analysis.filter(a => a.canDelete);
  const nonDeletable = analysis.filter(a => !a.canDelete);
  const pending = analysis.filter(a => a.dependencies?.isPending);
  const failed = analysis.filter(a => a.dependencies?.isFailed);
  const recent = analysis.filter(a => a.dependencies?.isRecent);

  console.log(`\n📊 의존성 분석 완료:`);
  console.log(`✅ 삭제 가능: ${deletable.length}개`);
  console.log(`❌ 삭제 불가: ${nonDeletable.length}개`);
  console.log(`🔄 처리 중: ${pending.length}개`);
  console.log(`❌ 실패: ${failed.length}개`);
  console.log(`🆕 최근 생성: ${recent.length}개`);

  return {
    analysis,
    summary: {
      total: reportIds.length,
      deletable: deletable.length,
      nonDeletable: nonDeletable.length,
      pending: pending.length,
      failed: failed.length,
      recent: recent.length
    },
    recommendations: {
      safeDeletion: deletable.filter(a => a.dependencies.riskLevel === 'low').map(a => a.report.id),
      requiresReview: deletable.filter(a => a.dependencies.riskLevel !== 'low').map(a => ({
        reportId: a.report.id,
        title: a.report.title,
        riskLevel: a.dependencies.riskLevel,
        recommendations: a.recommendations
      }))
    }
  };
}

function getRiskEmoji(riskLevel) {
  const emojis = {
    'high': '🚨',
    'medium': '⚠️',
    'low': '✅'
  };
  return emojis[riskLevel] || '❓';
}

// 사용 예시
const dependencyAnalysis = await analyzeTechReportDependencies(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
);

console.log('분석 결과:', dependencyAnalysis.summary);
console.log('안전 삭제 가능:', dependencyAnalysis.recommendations.safeDeletion);
console.log('검토 필요:', dependencyAnalysis.recommendations.requiresReview);

// 안전한 보고서만 삭제 실행
if (dependencyAnalysis.recommendations.safeDeletion.length > 0) {
  const safeDeleteResult = await bulkDeleteTechReports(
    'https://your-domain.com', 
    'YOUR_JWT_TOKEN', 
    dependencyAnalysis.recommendations.safeDeletion,
    { safeMode: false, createBackup: true }
  );
  console.log('안전 삭제 완료:', safeDeleteResult.summary);
}
```

### 6. 삭제 작업 스케줄러

```javascript
class TechReportDeletionScheduler {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.scheduledTasks = [];
    this.runningTasks = new Set();
  }

  scheduleCleanup(scheduleConfig) {
    const taskId = `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task = {
      id: taskId,
      type: 'cleanup',
      config: scheduleConfig,
      scheduledFor: new Date(scheduleConfig.executeAt),
      status: 'scheduled',
      createdAt: new Date()
    };

    this.scheduledTasks.push(task);
    
    // 실행 시간까지 대기
    const delay = task.scheduledFor.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => this.executeCleanup(taskId), delay);
      console.log(`📅 정리 작업 예약: ${taskId} (${delay}ms 후 실행)`);
    } else {
      console.log('⚠️  과거 시간으로는 예약할 수 없습니다.');
    }

    return taskId;
  }

  async executeCleanup(taskId) {
    const task = this.scheduledTasks.find(t => t.id === taskId);
    if (!task || this.runningTasks.has(taskId)) {
      return;
    }

    this.runningTasks.add(taskId);
    task.status = 'running';
    task.startedAt = new Date();

    try {
      console.log(`🔄 정리 작업 시작: ${taskId}`);
      
      const result = await deleteTechReportsByCondition(
        this.apiUrl, 
        this.token, 
        task.config.condition,
        task.config.options || {}
      );

      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;

      console.log(`✅ 정리 작업 완료: ${taskId}`);
      console.log(`   삭제된 보고서: ${result.deleted.length}개`);
      console.log(`   실패한 보고서: ${result.failed.length}개`);

    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      task.failedAt = new Date();
      
      console.error(`❌ 정리 작업 실패: ${taskId} - ${error.message}`);
    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  scheduleRecurringCleanup(recurringConfig) {
    const { interval, condition, options = {} } = recurringConfig;
    
    const executeRecurring = async () => {
      try {
        console.log('🔄 반복 정리 작업 실행 중...');
        
        const result = await deleteTechReportsByCondition(
          this.apiUrl, 
          this.token, 
          condition,
          options
        );

        console.log(`✅ 반복 정리 완료: 삭제 ${result.deleted.length}개, 실패 ${result.failed.length}개`);
        
      } catch (error) {
        console.error('❌ 반복 정리 실패:', error.message);
      }
    };

    // 즉시 실행 후 반복
    executeRecurring();
    const intervalId = setInterval(executeRecurring, interval);

    console.log(`🔁 반복 정리 작업 시작 (${interval}ms 간격)`);
    
    return {
      stop: () => {
        clearInterval(intervalId);
        console.log('🛑 반복 정리 작업 중지');
      }
    };
  }

  getScheduledTasks() {
    return this.scheduledTasks;
  }

  getTaskStatus(taskId) {
    return this.scheduledTasks.find(t => t.id === taskId);
  }

  cancelTask(taskId) {
    const taskIndex = this.scheduledTasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      const task = this.scheduledTasks[taskIndex];
      if (task.status === 'scheduled') {
        task.status = 'cancelled';
        task.cancelledAt = new Date();
        console.log(`❌ 작업 취소: ${taskId}`);
        return true;
      }
    }
    return false;
  }
}

// 사용 예시
const scheduler = new TechReportDeletionScheduler('https://your-domain.com', 'YOUR_JWT_TOKEN');

// 1. 특정 시간에 실패한 보고서 정리 예약
const cleanupTaskId = scheduler.scheduleCleanup({
  executeAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간 후
  condition: { failedOnly: true },
  options: { createBackup: true }
});

// 2. 매주 오래된 보고서 정리 (7일마다)
const weeklyCleanup = scheduler.scheduleRecurringCleanup({
  interval: 7 * 24 * 60 * 60 * 1000, // 7일
  condition: { 
    olderThanDays: 90,
    status: ['failed', 'pending']
  },
  options: { 
    createBackup: true,
    maxDelete: 100 
  }
});

// 3. 매일 중복 URL 정리
const dailyDuplicateCleanup = scheduler.scheduleRecurringCleanup({
  interval: 24 * 60 * 60 * 1000, // 1일
  condition: { duplicateUrls: true },
  options: { safeMode: true }
});

// 작업 상태 확인
setTimeout(() => {
  console.log('예약된 작업들:', scheduler.getScheduledTasks());
}, 1000);

// 필요시 반복 작업 중지
// weeklyCleanup.stop();
// dailyDuplicateCleanup.stop();
```

## ⚠️ 중요 주의사항

### 데이터 무결성
1. **복구 불가능**: 삭제된 보고서는 복구할 수 없습니다
2. **백업 생성**: 중요한 보고서 삭제 전 백업을 생성하세요
3. **일괄 삭제**: 대량 삭제 시 단계적으로 진행하세요

### 권한 관리
- 보고서 삭제는 관리자 권한이 필요합니다
- 처리 중인(`pending`) 보고서는 신중하게 삭제하세요

### 성능 고려사항
- API 호출 제한을 준수하세요
- 대량 삭제 시 배치 처리와 지연시간을 적절히 설정하세요

이 API를 통해 기술 분석 보고서를 안전하고 효율적으로 관리할 수 있습니다.