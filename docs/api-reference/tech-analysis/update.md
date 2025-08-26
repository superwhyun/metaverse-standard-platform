# 기술 분석 보고서 수정 API

## 개요

기존 기술 분석 보고서의 정보를 수정합니다. 제목, 요약, URL, 이미지, 카테고리 등을 변경할 수 있으며, 관리자 권한이 필요합니다.

## 기본 정보

- **HTTP 메서드**: `PUT`
- **엔드포인트**: `/api/tech-analysis/{id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
PUT /api/tech-analysis/{id}
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 수정할 보고서 ID | `1` |

### 요청 본문

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `title` | string | ✅ | 보고서 제목 | `"메타버스 기술 동향 2024"` |
| `summary` | string | ❌ | 보고서 요약 | `"2024년 메타버스 기술의 주요 발전..."` |
| `url` | string | ❌ | 원본 URL | `"https://example.com/metaverse-trends"` |
| `image_url` | string | ❌ | 썸네일 이미지 URL | `"https://example.com/thumb.jpg"` |
| `category_name` | string | ❌ | 카테고리명 | `"메타버스"` |

### 요청 예시

```bash
curl -X PUT https://your-domain.com/api/tech-analysis/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "메타버스 기술 동향 2024",
    "summary": "2024년 메타버스 기술의 주요 발전 현황과 미래 전망을 분석합니다.",
    "url": "https://example.com/metaverse-trends-2024",
    "image_url": "https://example.com/images/metaverse.jpg",
    "category_name": "메타버스"
  }'
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "id": 1,
  "title": "메타버스 기술 동향 2024",
  "summary": "2024년 메타버스 기술의 주요 발전 현황과 미래 전망을 분석합니다.",
  "url": "https://example.com/metaverse-trends-2024",
  "image_url": "https://example.com/images/metaverse.jpg",
  "category_name": "메타버스",
  "status": "completed",
  "created_at": "2024-08-25T10:00:00.000Z",
  "updated_at": "2024-08-25T15:30:00.000Z"
}
```

### 에러 응답

#### 보고서 없음 (404)
```json
{
  "message": "해당 기술 소식을 찾을 수 없습니다."
}
```

#### 필수 필드 누락 (400)
```json
{
  "message": "ID와 제목이 필요합니다."
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
  "message": "기술 소식 수정에 실패했습니다."
}
```

## 실용적인 사용 예시

### 1. JavaScript로 보고서 수정

```javascript
async function updateTechAnalysisReport(apiUrl, token, reportId, updateData) {
  try {
    const response = await fetch(`${apiUrl}/api/tech-analysis/${reportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('보고서를 찾을 수 없습니다.');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || '요청 데이터가 올바르지 않습니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedReport = await response.json();
    return updatedReport;
  } catch (error) {
    console.error('보고서 수정 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const updatedReport = await updateTechAnalysisReport('https://your-domain.com', 'YOUR_JWT_TOKEN', 1, {
    title: '메타버스 기술 동향 2024',
    summary: '2024년 메타버스 기술의 주요 발전 현황과 미래 전망을 분석합니다.',
    category_name: '메타버스'
  });
  console.log('✅ 보고서 수정 성공:', updatedReport);
} catch (error) {
  console.error('❌ 수정 실패:', error.message);
}
```

### 2. 안전한 보고서 수정

```javascript
async function safeUpdateTechReport(apiUrl, token, reportId, updateData) {
  try {
    // 1. 기존 보고서 정보 조회
    console.log(`🔍 보고서 ID ${reportId} 현재 정보 조회 중...`);
    const currentReport = await fetch(`${apiUrl}/api/tech-analysis?limit=1000`)
      .then(r => r.json())
      .then(data => data.data.find(report => report.id === reportId));

    if (!currentReport) {
      throw new Error('수정하려는 보고서를 찾을 수 없습니다.');
    }

    console.log('📋 현재 보고서 정보:');
    console.log(`  제목: ${currentReport.title}`);
    console.log(`  카테고리: ${currentReport.category_name || '기타'}`);
    console.log(`  상태: ${currentReport.status}`);
    console.log(`  URL: ${currentReport.url}`);

    // 2. 변경사항 확인
    const changes = {};
    if (updateData.title && updateData.title !== currentReport.title) {
      changes.title = { from: currentReport.title, to: updateData.title };
    }
    if (updateData.summary && updateData.summary !== currentReport.summary) {
      changes.summary = { from: currentReport.summary, to: updateData.summary };
    }
    if (updateData.url && updateData.url !== currentReport.url) {
      changes.url = { from: currentReport.url, to: updateData.url };
    }
    if (updateData.category_name && updateData.category_name !== currentReport.category_name) {
      changes.category_name = { from: currentReport.category_name, to: updateData.category_name };
    }
    if (updateData.image_url && updateData.image_url !== currentReport.image_url) {
      changes.image_url = { from: currentReport.image_url, to: updateData.image_url };
    }

    if (Object.keys(changes).length === 0) {
      console.log('ℹ️  변경사항이 없습니다.');
      return { success: true, report: currentReport, noChanges: true };
    }

    console.log('📝 변경사항:');
    Object.entries(changes).forEach(([field, change]) => {
      console.log(`  ${field}: "${change.from || 'null'}" → "${change.to}"`);
    });

    // 3. URL 유효성 검사
    if (updateData.url) {
      try {
        new URL(updateData.url);
      } catch (error) {
        throw new Error('유효하지 않은 URL 형식입니다.');
      }
    }

    // 4. 제목 길이 검사
    if (updateData.title && updateData.title.length > 200) {
      console.warn('⚠️  제목이 200자를 초과합니다. 잘릴 수 있습니다.');
    }

    // 5. 실제 수정 실행
    console.log('🔄 보고서 수정 중...');
    const updatedReport = await updateTechAnalysisReport(apiUrl, token, reportId, updateData);

    console.log('✅ 보고서 수정 완료');
    return {
      success: true,
      report: updatedReport,
      changes,
      previousReport: currentReport
    };

  } catch (error) {
    console.error('❌ 안전 수정 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 사용 예시
const result = await safeUpdateTechReport('https://your-domain.com', 'YOUR_JWT_TOKEN', 1, {
  title: 'AI 기술 동향 2024 (업데이트)',
  summary: '2024년 인공지능 기술의 최신 발전사항과 전망을 분석한 업데이트된 보고서입니다.',
  category_name: '인공지능'
});

if (result.success && !result.noChanges) {
  console.log('변경된 보고서:', result.report.title);
}
```

### 3. 일괄 보고서 수정

```javascript
async function bulkUpdateTechReports(apiUrl, token, updates, options = {}) {
  const { 
    batchSize = 3, 
    delay = 1500,
    safeMode = true,
    validateUrls = true 
  } = options;
  
  const results = [];
  
  console.log(`📦 ${updates.length}개 보고서 일괄 수정 시작`);
  
  // 배치 단위로 처리
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    console.log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (const updateItem of batch) {
      const { reportId, ...updateData } = updateItem;
      
      try {
        // URL 유효성 검사
        if (validateUrls && updateData.url) {
          try {
            new URL(updateData.url);
          } catch (error) {
            throw new Error(`유효하지 않은 URL: ${updateData.url}`);
          }
        }

        let result;
        if (safeMode) {
          result = await safeUpdateTechReport(apiUrl, token, reportId, updateData);
        } else {
          const updatedReport = await updateTechAnalysisReport(apiUrl, token, reportId, updateData);
          result = { success: true, report: updatedReport };
        }
        
        if (result.success) {
          if (result.noChanges) {
            console.log(`  ➡️  변경사항 없음: ID ${reportId}`);
          } else {
            console.log(`  ✅ 수정 완료: ${result.report.title} (ID: ${reportId})`);
          }
        }
        
        results.push({ ...result, reportId });

      } catch (error) {
        results.push({
          success: false,
          reportId,
          error: error.message
        });
        console.log(`  ❌ 수정 실패: ID ${reportId} - ${error.message}`);
      }

      // 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 300));
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
const reportsToUpdate = [
  {
    reportId: 1,
    title: 'AI 기술 동향 2024 (수정)',
    category_name: '인공지능'
  },
  {
    reportId: 2,
    summary: '블록체인 기술의 최신 발전사항을 다룬 업데이트된 분석 보고서',
    category_name: '블록체인'
  },
  {
    reportId: 3,
    title: '메타버스 플랫폼 비교 분석',
    url: 'https://updated-example.com/metaverse-platforms',
    image_url: 'https://updated-example.com/new-image.jpg'
  }
];

const bulkResult = await bulkUpdateTechReports(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  reportsToUpdate,
  {
    batchSize: 2,
    delay: 2000,
    safeMode: true,
    validateUrls: true
  }
);
```

### 4. 카테고리별 보고서 수정

```javascript
async function updateReportsByCategory(apiUrl, token, categoryName, updateData, options = {}) {
  const { dryRun = false, maxUpdates = 50 } = options;
  
  try {
    // 1. 해당 카테고리의 모든 보고서 조회
    console.log(`🔍 "${categoryName}" 카테고리 보고서 조회 중...`);
    const reportsResponse = await fetch(`${apiUrl}/api/tech-analysis?category=${encodeURIComponent(categoryName)}&limit=1000`);
    const reportsData = await reportsResponse.json();
    
    if (!reportsData.data || reportsData.data.length === 0) {
      console.log('해당 카테고리에 보고서가 없습니다.');
      return { updated: [], total: 0 };
    }
    
    const reports = reportsData.data.slice(0, maxUpdates); // 최대 개수 제한
    
    console.log(`📊 "${categoryName}" 카테고리에서 ${reports.length}개 보고서 발견`);
    
    if (dryRun) {
      console.log('🔬 드라이런 모드 - 실제 수정하지 않고 미리보기만 실행');
      console.log('\n수정 예정 보고서:');
      reports.forEach((report, index) => {
        console.log(`  ${index + 1}. ${report.title} (ID: ${report.id})`);
      });
      
      console.log('\n적용될 변경사항:');
      Object.entries(updateData).forEach(([key, value]) => {
        console.log(`  ${key}: "${value}"`);
      });
      
      return { 
        previewReports: reports,
        changes: updateData,
        totalCount: reports.length
      };
    }
    
    // 2. 실제 수정 실행
    const updatePromises = reports.map(report => ({
      reportId: report.id,
      ...updateData
    }));
    
    const result = await bulkUpdateTechReports(apiUrl, token, updatePromises, {
      batchSize: 3,
      delay: 1000,
      safeMode: true
    });
    
    return {
      ...result,
      categoryName,
      totalInCategory: reports.length
    };
    
  } catch (error) {
    console.error('❌ 카테고리별 수정 실패:', error);
    throw error;
  }
}

// 사용 예시들

// 드라이런으로 미리보기
const preview = await updateReportsByCategory(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  '인공지능',
  { summary: '인공지능 관련 기술 분석 보고서입니다.' },
  { dryRun: true }
);

console.log('미리보기 결과:', preview);

// 실제 수정 실행
const updateResult = await updateReportsByCategory(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  '인공지능',
  { 
    summary: '인공지능 기술의 최신 동향과 발전사항을 분석한 보고서입니다.',
    category_name: 'AI/인공지능' // 카테고리명 통일
  },
  { maxUpdates: 20 }
);

console.log('수정 결과:', updateResult.summary);
```

### 5. URL 기반 보고서 재처리

```javascript
async function refreshReportFromUrl(apiUrl, token, reportId) {
  try {
    // 1. 기존 보고서 정보 조회
    console.log(`🔍 보고서 ID ${reportId} 정보 조회 중...`);
    const currentReport = await fetch(`${apiUrl}/api/tech-analysis?limit=1000`)
      .then(r => r.json())
      .then(data => data.data.find(report => report.id === reportId));

    if (!currentReport) {
      throw new Error('보고서를 찾을 수 없습니다.');
    }

    if (!currentReport.url) {
      throw new Error('URL이 없는 보고서는 재처리할 수 없습니다.');
    }

    console.log(`📄 현재 보고서: ${currentReport.title}`);
    console.log(`🌐 URL: ${currentReport.url}`);

    // 2. 메타데이터 서비스에서 최신 정보 가져오기
    console.log('🔄 메타데이터 재추출 중...');
    const metadataUrl = `http://xtandards.is-an.ai:3100/api/metadata?url=${encodeURIComponent(currentReport.url)}`;
    
    const metadataResponse = await fetch(metadataUrl);
    
    if (!metadataResponse.ok) {
      throw new Error('메타데이터 서비스 호출 실패');
    }
    
    const metadata = await metadataResponse.json();
    
    if (!metadata.status) {
      throw new Error('메타데이터 추출 실패');
    }

    // 3. AI 카테고리 재분류 (OpenAI API 필요)
    console.log('🤖 AI 카테고리 재분류 중...');
    let newCategoryName = currentReport.category_name;
    
    // 실제 환경에서는 categorizeContent 함수 호출
    // newCategoryName = await categorizeContent(metadata.data.title, metadata.data.description);

    // 4. 새로운 정보로 업데이트
    const updateData = {
      title: metadata.data.title || currentReport.title,
      summary: metadata.data.description || currentReport.summary || '설명이 없습니다.',
      image_url: metadata.data.image || currentReport.image_url,
      category_name: newCategoryName
    };

    console.log('📝 업데이트될 정보:');
    console.log(`  제목: ${updateData.title}`);
    console.log(`  요약: ${updateData.summary.substring(0, 100)}...`);
    console.log(`  이미지: ${updateData.image_url || '없음'}`);
    console.log(`  카테고리: ${updateData.category_name || '기타'}`);

    // 5. 보고서 업데이트
    const updatedReport = await updateTechAnalysisReport(apiUrl, token, reportId, updateData);

    console.log('✅ 보고서 재처리 완료');
    return {
      success: true,
      originalReport: currentReport,
      updatedReport,
      metadata: metadata.data
    };

  } catch (error) {
    console.error('❌ URL 기반 재처리 실패:', error);
    throw error;
  }
}

// 여러 보고서 일괄 재처리
async function bulkRefreshReportsFromUrls(apiUrl, token, reportIds, options = {}) {
  const { batchSize = 2, delay = 3000 } = options;
  const results = [];

  console.log(`🔄 ${reportIds.length}개 보고서 일괄 재처리 시작`);

  for (let i = 0; i < reportIds.length; i += batchSize) {
    const batch = reportIds.slice(i, i + batchSize);
    console.log(`\n📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중`);

    for (const reportId of batch) {
      try {
        const result = await refreshReportFromUrl(apiUrl, token, reportId);
        results.push({ reportId, ...result });
        console.log(`  ✅ 재처리 완료: ID ${reportId}`);
      } catch (error) {
        results.push({
          reportId,
          success: false,
          error: error.message
        });
        console.log(`  ❌ 재처리 실패: ID ${reportId} - ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (i + batchSize < reportIds.length) {
      console.log(`⏳ ${delay}ms 대기 중...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📊 일괄 재처리 완료`);
  console.log(`✅ 성공: ${successful.length}개`);
  console.log(`❌ 실패: ${failed.length}개`);

  return { results, summary: { successful: successful.length, failed: failed.length } };
}

// 사용 예시
// 단일 보고서 재처리
const refreshResult = await refreshReportFromUrl('https://your-domain.com', 'YOUR_JWT_TOKEN', 1);

// 여러 보고서 일괄 재처리
const bulkRefreshResult = await bulkRefreshReportsFromUrls(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  [1, 2, 3, 4, 5],
  { batchSize: 2, delay: 2000 }
);
```

### 6. 보고서 수정 이력 관리

```javascript
class TechReportUpdateManager {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.updateHistory = [];
  }

  async updateWithHistory(reportId, updateData, metadata = {}) {
    try {
      // 1. 기존 보고서 정보 백업
      const originalReport = await fetch(`${this.apiUrl}/api/tech-analysis?limit=1000`)
        .then(r => r.json())
        .then(data => data.data.find(report => report.id === reportId));
      
      if (!originalReport) {
        throw new Error('보고서를 찾을 수 없습니다.');
      }
      
      // 2. 변경사항 분석
      const changes = this.analyzeChanges(originalReport, updateData);
      
      // 3. 보고서 업데이트
      const updatedReport = await updateTechAnalysisReport(this.apiUrl, this.token, reportId, updateData);
      
      // 4. 이력 기록
      const historyEntry = {
        id: Date.now(),
        reportId,
        timestamp: new Date().toISOString(),
        original: originalReport,
        updated: updatedReport,
        changes,
        metadata: {
          updatedBy: metadata.updatedBy || 'system',
          reason: metadata.reason || '',
          source: metadata.source || 'api',
          ...metadata
        }
      };
      
      this.updateHistory.push(historyEntry);
      
      console.log(`📝 보고서 수정 이력 기록: ${updatedReport.title}`);
      console.log(`   변경사항: ${Object.keys(changes).join(', ')}`);
      
      return {
        success: true,
        report: updatedReport,
        historyEntry
      };
      
    } catch (error) {
      console.error('❌ 이력 관리 업데이트 실패:', error);
      throw error;
    }
  }

  analyzeChanges(original, updateData) {
    const changes = {};
    
    Object.keys(updateData).forEach(key => {
      const newValue = updateData[key];
      const originalValue = original[key];
      
      if (newValue !== originalValue) {
        changes[key] = {
          from: originalValue,
          to: newValue
        };
      }
    });
    
    return changes;
  }

  getHistory(reportId = null) {
    if (reportId) {
      return this.updateHistory.filter(entry => entry.reportId === reportId);
    }
    return this.updateHistory;
  }

  exportHistory() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEntries: this.updateHistory.length,
      history: this.updateHistory
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  getUpdateStats() {
    const stats = {
      totalUpdates: this.updateHistory.length,
      byField: {},
      byUser: {},
      recentUpdates: 0 // 최근 24시간
    };

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.updateHistory.forEach(entry => {
      // 필드별 통계
      Object.keys(entry.changes).forEach(field => {
        stats.byField[field] = (stats.byField[field] || 0) + 1;
      });

      // 사용자별 통계
      const user = entry.metadata.updatedBy;
      stats.byUser[user] = (stats.byUser[user] || 0) + 1;

      // 최근 업데이트
      if (new Date(entry.timestamp) > yesterday) {
        stats.recentUpdates++;
      }
    });

    return stats;
  }
}

// 사용 예시
const updateManager = new TechReportUpdateManager('https://your-domain.com', 'YOUR_JWT_TOKEN');

// 이력과 함께 업데이트
const updateResult = await updateManager.updateWithHistory(1, {
  title: 'AI 기술 동향 2024 (최종 수정)',
  summary: '인공지능 기술의 최신 동향과 미래 전망을 종합적으로 분석한 보고서입니다.',
  category_name: 'AI/인공지능'
}, {
  updatedBy: 'admin@example.com',
  reason: '내용 보완 및 카테고리 정리',
  source: 'admin_panel'
});

// 특정 보고서의 수정 이력 조회
const reportHistory = updateManager.getHistory(1);
console.log('보고서 수정 이력:', reportHistory);

// 수정 통계 조회
const stats = updateManager.getUpdateStats();
console.log('수정 통계:', stats);

// 이력 내보내기
const historyData = updateManager.exportHistory();
console.log('이력 데이터 내보내기 완료');
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | number | 보고서 ID | `1` |
| `title` | string | 보고서 제목 | `"메타버스 기술 동향 2024"` |
| `summary` | string | 보고서 요약 | `"2024년 메타버스..."` |
| `url` | string | 원본 URL | `"https://example.com"` |
| `image_url` | string\|null | 썸네일 이미지 URL | `"https://..."` |
| `category_name` | string\|null | 카테고리명 | `"메타버스"` |
| `status` | string | 처리 상태 | `"completed"`, `"pending"`, `"failed"` |
| `created_at` | string | 생성 일시 | `"2024-08-25T10:00:00.000Z"` |
| `updated_at` | string | 수정 일시 | `"2024-08-25T15:30:00.000Z"` |

## 주의사항

- 보고서 수정은 관리자 권한이 필요합니다
- `title` 필드는 필수입니다
- URL 변경 시 유효한 형식인지 확인하세요
- 대량 수정 시 API 호출 제한에 주의하세요
- 중요한 보고서 수정 전 백업을 생성하세요

이 API를 통해 기술 분석 보고서를 효율적으로 관리하고 업데이트할 수 있습니다.