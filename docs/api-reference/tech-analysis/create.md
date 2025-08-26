# 기술 분석 보고서 생성 API

## 개요

URL에서 자동으로 메타데이터를 추출하여 새로운 기술 분석 보고서를 생성합니다. AI를 활용한 자동 카테고리 분류 기능을 제공합니다.

## 기본 정보

- **HTTP 메서드**: `POST`
- **엔드포인트**: `/api/tech-analysis`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
POST /api/tech-analysis
Content-Type: application/json
```

### 요청 본문

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `url` | string | ✅ | 분석할 웹페이지 URL | `"https://example.com/ai-trends-2024"` |

### 요청 예시

```bash
curl -X POST https://your-domain.com/api/tech-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/ai-trends-2024"
  }'
```

## 응답 형식

### 성공 응답 (201)

#### 즉시 처리 완료 (로컬 환경)
```json
{
  "id": 1,
  "title": "AI 기술 동향 2024",
  "summary": "2024년 인공지능 기술의 주요 발전 현황과 미래 전망을 분석합니다.",
  "url": "https://example.com/ai-trends-2024",
  "image_url": "https://example.com/images/ai-trends.jpg",
  "category_name": "인공지능",
  "status": "completed",
  "created_at": "2024-08-25T10:00:00.000Z",
  "updated_at": "2024-08-25T10:00:00.000Z"
}
```

#### 비동기 처리 (클라우드플레어 환경)
```json
{
  "id": 1,
  "title": "https://example.com/ai-trends-2024",
  "summary": "메타데이터를 분석 중입니다...",
  "url": "https://example.com/ai-trends-2024",
  "image_url": null,
  "category_name": null,
  "status": "pending",
  "created_at": "2024-08-25T10:00:00.000Z",
  "updated_at": "2024-08-25T10:00:00.000Z"
}
```

### 에러 응답

#### URL 누락 (400)
```json
{
  "message": "URL is required"
}
```

#### 잘못된 URL 형식 (400)
```json
{
  "message": "Invalid URL format"
}
```

#### 서버 오류 (500)
```json
{
  "message": "Failed to create tech analysis report"
}
```

## 실용적인 사용 예시

### 1. JavaScript로 보고서 생성

```javascript
async function createTechAnalysisReport(apiUrl, url) {
  try {
    // URL 유효성 검사
    try {
      new URL(url);
    } catch (error) {
      throw new Error('유효하지 않은 URL 형식입니다.');
    }

    const response = await fetch(`${apiUrl}/api/tech-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const report = await response.json();
    return report;
  } catch (error) {
    console.error('보고서 생성 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const report = await createTechAnalysisReport(
    'https://your-domain.com', 
    'https://example.com/ai-trends-2024'
  );
  
  if (report.status === 'pending') {
    console.log('📝 보고서가 생성되었습니다. 메타데이터 분석 중...');
    console.log(`보고서 ID: ${report.id}`);
    // 폴링으로 완료 상태 확인 필요
  } else {
    console.log('✅ 보고서 생성 완료:', report.title);
  }
} catch (error) {
  console.error('❌ 생성 실패:', error.message);
}
```

### 2. 처리 상태 폴링

```javascript
async function waitForReportCompletion(apiUrl, reportId, maxAttempts = 30) {
  let attempts = 0;
  const pollInterval = 2000; // 2초 간격

  while (attempts < maxAttempts) {
    try {
      console.log(`🔄 처리 상태 확인 중... (${attempts + 1}/${maxAttempts})`);
      
      const response = await fetch(`${apiUrl}/api/tech-analysis/${reportId}`);
      
      if (!response.ok) {
        throw new Error('보고서 조회 실패');
      }

      const report = await response.json();

      switch (report.status) {
        case 'completed':
          console.log('✅ 처리 완료!');
          return report;
        
        case 'failed':
          console.log('❌ 처리 실패');
          throw new Error('보고서 처리에 실패했습니다.');
        
        case 'pending':
          console.log('⏳ 처리 중...');
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
          break;
        
        default:
          console.warn('⚠️  알 수 없는 상태:', report.status);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
      }

    } catch (error) {
      console.error('폴링 오류:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(`처리 시간이 초과되었습니다. (최대 ${maxAttempts * pollInterval / 1000}초)`);
}

// 사용 예시
async function createAndWaitForReport(apiUrl, url) {
  try {
    // 1. 보고서 생성
    const initialReport = await createTechAnalysisReport(apiUrl, url);
    
    // 2. 즉시 완료된 경우
    if (initialReport.status === 'completed') {
      return initialReport;
    }
    
    // 3. 비동기 처리인 경우 완료 대기
    console.log(`📝 보고서 ID ${initialReport.id} 처리 대기 중...`);
    const completedReport = await waitForReportCompletion(apiUrl, initialReport.id);
    
    return completedReport;
    
  } catch (error) {
    console.error('보고서 생성 및 처리 실패:', error);
    throw error;
  }
}

// 사용 예시
const report = await createAndWaitForReport(
  'https://your-domain.com',
  'https://example.com/metaverse-standards'
);

console.log('최종 보고서:', report.title);
console.log('카테고리:', report.category_name);
```

### 3. 일괄 보고서 생성

```javascript
async function bulkCreateTechReports(apiUrl, urls, options = {}) {
  const { 
    batchSize = 3, 
    delay = 2000,
    waitForCompletion = true,
    maxWaitTime = 60000 // 60초
  } = options;
  
  const results = [];
  
  console.log(`📦 ${urls.length}개 URL 일괄 처리 시작`);
  
  // 배치 단위로 처리
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    // 병렬 생성
    const batchPromises = batch.map(async (url) => {
      try {
        console.log(`  📝 생성 시작: ${url}`);
        const report = await createTechAnalysisReport(apiUrl, url);
        
        if (waitForCompletion && report.status === 'pending') {
          console.log(`  ⏳ 완료 대기: ${url}`);
          const completedReport = await waitForReportCompletion(apiUrl, report.id, 30);
          console.log(`  ✅ 완료: ${completedReport.title}`);
          return { success: true, report: completedReport, url };
        } else {
          console.log(`  ✅ 즉시 완료: ${report.title}`);
          return { success: true, report, url };
        }
        
      } catch (error) {
        console.log(`  ❌ 실패: ${url} - ${error.message}`);
        return { success: false, error: error.message, url };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // 배치 간 지연
    if (i + batchSize < urls.length) {
      console.log(`⏳ ${delay}ms 대기 중...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 결과 요약
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📊 일괄 처리 완료`);
  console.log(`✅ 성공: ${successful.length}개`);
  console.log(`❌ 실패: ${failed.length}개`);

  return { 
    results, 
    summary: { 
      successful: successful.length, 
      failed: failed.length,
      total: urls.length
    } 
  };
}

// 사용 예시
const urlsToProcess = [
  'https://example.com/ai-trends-2024',
  'https://example.com/blockchain-analysis',
  'https://example.com/metaverse-report',
  'https://example.com/quantum-computing',
  'https://example.com/iot-security'
];

const bulkResult = await bulkCreateTechReports(
  'https://your-domain.com',
  urlsToProcess,
  {
    batchSize: 2,
    delay: 3000,
    waitForCompletion: true
  }
);

// 성공한 보고서들 출력
bulkResult.results
  .filter(r => r.success)
  .forEach(r => {
    console.log(`📄 ${r.report.title} (${r.report.category_name || '기타'})`);
  });
```

### 4. CSV에서 URL 목록 가져오기

```javascript
async function createReportsFromCSV(apiUrl, csvContent, options = {}) {
  try {
    const { urlColumnIndex = 0, titleColumnIndex = 1 } = options;
    
    // CSV 파싱
    const lines = csvContent.trim().split('\n');
    const urls = [];
    
    // 헤더 스킵하고 URL 추출
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns[urlColumnIndex] && columns[urlColumnIndex].startsWith('http')) {
        urls.push({
          url: columns[urlColumnIndex],
          expectedTitle: columns[titleColumnIndex] || null
        });
      }
    }

    console.log(`📂 CSV에서 ${urls.length}개 URL 파싱 완료`);
    
    // 일괄 생성 실행
    const urlList = urls.map(item => item.url);
    const result = await bulkCreateTechReports(apiUrl, urlList, options);

    // 결과를 CSV 형태로 저장
    const resultCsvContent = [
      'URL,Title,Category,Status,Error,CreatedAt',
      ...result.results.map(r => {
        if (r.success) {
          const report = r.report;
          return `"${r.url}","${report.title}","${report.category_name || ''}","${report.status}","","${report.created_at}"`;
        } else {
          return `"${r.url}","","","failed","${r.error}",""`;
        }
      })
    ].join('\n');

    // 결과 파일 저장
    const resultFilename = `tech-report-creation-result-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    
    // Node.js 환경에서 파일 저장
    if (typeof require !== 'undefined') {
      require('fs').writeFileSync(resultFilename, resultCsvContent);
      console.log(`📄 결과 파일 저장: ${resultFilename}`);
    }

    return { result, resultFilename, resultCsvContent };

  } catch (error) {
    console.error('❌ CSV 처리 실패:', error.message);
    throw error;
  }
}

// 사용 예시
const csvContent = `
URL,Expected Title
"https://example.com/ai-trends-2024","AI Trends 2024"
"https://example.com/blockchain-analysis","Blockchain Analysis Report"
"https://example.com/metaverse-report","Metaverse Market Report"
"https://example.com/quantum-computing","Quantum Computing Advances"
`;

const csvResult = await createReportsFromCSV(
  'https://your-domain.com',
  csvContent,
  {
    batchSize: 2,
    delay: 2000,
    waitForCompletion: true,
    urlColumnIndex: 0,
    titleColumnIndex: 1
  }
);

console.log('CSV 처리 완료:', csvResult.result.summary);
```

### 5. 보고서 생성 진행률 추적

```javascript
class TechReportCreationTracker {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.activeJobs = new Map();
    this.completedJobs = [];
    this.failedJobs = [];
  }

  async createWithTracking(url, metadata = {}) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      url,
      metadata,
      status: 'starting',
      startTime: Date.now(),
      reportId: null,
      report: null,
      error: null
    };

    this.activeJobs.set(jobId, job);

    try {
      // 보고서 생성
      job.status = 'creating';
      const report = await createTechAnalysisReport(this.apiUrl, url);
      job.reportId = report.id;
      job.status = report.status === 'completed' ? 'completed' : 'processing';

      if (report.status === 'pending') {
        // 비동기 처리인 경우 폴링 시작
        this.pollReportCompletion(jobId, report.id);
      } else {
        // 즉시 완료
        job.report = report;
        job.status = 'completed';
        job.endTime = Date.now();
        this.moveToCompleted(jobId);
      }

      return { jobId, report };

    } catch (error) {
      job.error = error.message;
      job.status = 'failed';
      job.endTime = Date.now();
      this.moveToFailed(jobId);
      throw error;
    }
  }

  async pollReportCompletion(jobId, reportId) {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    try {
      const response = await fetch(`${this.apiUrl}/api/tech-analysis`);
      const reports = await response.json();
      const report = reports.data.find(r => r.id === reportId);

      if (report) {
        switch (report.status) {
          case 'completed':
            job.report = report;
            job.status = 'completed';
            job.endTime = Date.now();
            this.moveToCompleted(jobId);
            break;

          case 'failed':
            job.error = 'Processing failed';
            job.status = 'failed';
            job.endTime = Date.now();
            this.moveToFailed(jobId);
            break;

          case 'pending':
            // 계속 대기
            setTimeout(() => this.pollReportCompletion(jobId, reportId), 3000);
            break;
        }
      } else {
        // 보고서를 찾을 수 없는 경우
        setTimeout(() => this.pollReportCompletion(jobId, reportId), 3000);
      }

    } catch (error) {
      console.error(`폴링 오류 (Job ${jobId}):`, error);
      setTimeout(() => this.pollReportCompletion(jobId, reportId), 3000);
    }
  }

  moveToCompleted(jobId) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      this.completedJobs.push(job);
      this.activeJobs.delete(jobId);
      console.log(`✅ Job ${jobId} 완료: ${job.report?.title}`);
    }
  }

  moveToFailed(jobId) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      this.failedJobs.push(job);
      this.activeJobs.delete(jobId);
      console.log(`❌ Job ${jobId} 실패: ${job.error}`);
    }
  }

  getProgress() {
    const active = this.activeJobs.size;
    const completed = this.completedJobs.length;
    const failed = this.failedJobs.length;
    const total = active + completed + failed;

    return {
      total,
      active,
      completed,
      failed,
      completionRate: total > 0 ? ((completed + failed) / total * 100).toFixed(1) : 0,
      successRate: (completed + failed) > 0 ? (completed / (completed + failed) * 100).toFixed(1) : 0
    };
  }

  getJobStatus(jobId) {
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId);
    }

    const completed = this.completedJobs.find(job => job.id === jobId);
    if (completed) return completed;

    const failed = this.failedJobs.find(job => job.id === jobId);
    if (failed) return failed;

    return null;
  }

  getAllJobs() {
    return {
      active: Array.from(this.activeJobs.values()),
      completed: this.completedJobs,
      failed: this.failedJobs
    };
  }

  async createMultipleWithTracking(urls) {
    const jobs = [];
    
    for (const url of urls) {
      try {
        const { jobId, report } = await this.createWithTracking(url);
        jobs.push({ jobId, url, success: true });
        
        // 연속 요청 간 지연
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        jobs.push({ url, success: false, error: error.message });
      }
    }

    return jobs;
  }
}

// 사용 예시
const tracker = new TechReportCreationTracker('https://your-domain.com');

// 여러 보고서 생성 및 추적
const urls = [
  'https://example.com/ai-trends',
  'https://example.com/blockchain-report',
  'https://example.com/metaverse-analysis'
];

const jobs = await tracker.createMultipleWithTracking(urls);

// 진행률 모니터링
const monitorProgress = setInterval(() => {
  const progress = tracker.getProgress();
  console.log(`📊 진행률: ${progress.completionRate}% (${progress.completed}/${progress.total} 완료, 성공률: ${progress.successRate}%)`);
  
  if (progress.active === 0) {
    clearInterval(monitorProgress);
    console.log('🎉 모든 작업 완료!');
    
    const allJobs = tracker.getAllJobs();
    console.log('완료된 작업:', allJobs.completed.length);
    console.log('실패한 작업:', allJobs.failed.length);
  }
}, 2000);
```

### 6. 웹훅 연동 (가상 구현)

```javascript
class TechReportWebhookManager {
  constructor(apiUrl, webhookUrl) {
    this.apiUrl = apiUrl;
    this.webhookUrl = webhookUrl;
    this.pendingReports = new Set();
  }

  async createReportWithWebhook(url, webhookData = {}) {
    try {
      // 보고서 생성
      const report = await createTechAnalysisReport(this.apiUrl, url);
      
      if (report.status === 'pending') {
        // pending 상태인 경우 추적 목록에 추가
        this.pendingReports.add(report.id);
        
        // 주기적으로 상태 확인 시작
        this.startPolling(report.id, webhookData);
        
        // 즉시 webhook 발송 (생성 완료)
        await this.sendWebhook('created', {
          reportId: report.id,
          url: report.url,
          status: 'pending',
          ...webhookData
        });
        
      } else {
        // 즉시 완료된 경우
        await this.sendWebhook('completed', {
          reportId: report.id,
          url: report.url,
          title: report.title,
          category: report.category_name,
          status: 'completed',
          ...webhookData
        });
      }

      return report;

    } catch (error) {
      // 생성 실패 webhook
      await this.sendWebhook('failed', {
        url,
        error: error.message,
        status: 'failed',
        ...webhookData
      });
      
      throw error;
    }
  }

  async startPolling(reportId, webhookData) {
    const pollInterval = 3000; // 3초
    const maxAttempts = 60; // 3분
    let attempts = 0;

    const poll = async () => {
      try {
        if (attempts >= maxAttempts) {
          this.pendingReports.delete(reportId);
          await this.sendWebhook('timeout', {
            reportId,
            error: 'Processing timeout',
            ...webhookData
          });
          return;
        }

        // 보고서 상태 확인
        const response = await fetch(`${this.apiUrl}/api/tech-analysis`);
        const reports = await response.json();
        const report = reports.data.find(r => r.id === reportId);

        if (report) {
          switch (report.status) {
            case 'completed':
              this.pendingReports.delete(reportId);
              await this.sendWebhook('completed', {
                reportId: report.id,
                url: report.url,
                title: report.title,
                category: report.category_name,
                status: 'completed',
                processingTime: attempts * pollInterval,
                ...webhookData
              });
              return;

            case 'failed':
              this.pendingReports.delete(reportId);
              await this.sendWebhook('failed', {
                reportId: report.id,
                url: report.url,
                error: 'Processing failed',
                status: 'failed',
                processingTime: attempts * pollInterval,
                ...webhookData
              });
              return;

            case 'pending':
              // 계속 대기
              attempts++;
              setTimeout(poll, pollInterval);
              break;
          }
        } else {
          // 보고서를 찾을 수 없음
          attempts++;
          setTimeout(poll, pollInterval);
        }

      } catch (error) {
        console.error(`폴링 오류 (Report ${reportId}):`, error);
        attempts++;
        setTimeout(poll, pollInterval);
      }
    };

    setTimeout(poll, pollInterval);
  }

  async sendWebhook(event, data) {
    try {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`Webhook 전송 실패: ${response.status}`);
      } else {
        console.log(`📡 Webhook 전송 완료: ${event}`);
      }

    } catch (error) {
      console.error('Webhook 전송 오류:', error);
    }
  }

  getPendingReports() {
    return Array.from(this.pendingReports);
  }
}

// 사용 예시
const webhookManager = new TechReportWebhookManager(
  'https://your-domain.com',
  'https://your-webhook-endpoint.com/tech-reports'
);

// webhook과 함께 보고서 생성
const report = await webhookManager.createReportWithWebhook(
  'https://example.com/ai-trends-2024',
  {
    userId: 'user123',
    source: 'api_request',
    priority: 'high'
  }
);

console.log('보고서 생성 요청 완료:', report.id);
```

## 처리 흐름

### 1. 로컬 환경 (동기 처리)
1. URL 메타데이터 추출
2. AI 카테고리 분류
3. 데이터베이스 저장
4. 완성된 보고서 즉시 반환

### 2. 클라우드플레어 환경 (비동기 처리)
1. pending 상태 보고서 즉시 생성 및 반환
2. 백그라운드에서 메타데이터 처리
3. AI 카테고리 분류
4. 완료 후 상태 업데이트

## 주요 특징

- **자동 메타데이터 추출**: 제목, 요약, 이미지 URL 자동 추출
- **AI 카테고리 분류**: OpenAI API를 활용한 자동 분류
- **비동기 처리 지원**: 대용량 처리를 위한 백그라운드 작업
- **상태 추적**: pending, completed, failed 상태 관리

이 API를 통해 URL에서 기술 분석 보고서를 자동으로 생성할 수 있습니다.