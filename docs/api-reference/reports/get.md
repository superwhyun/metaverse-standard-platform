# 개별 보고서 조회 API

## 개요

특정 보고서의 상세 정보를 조회합니다. 본문 내용을 포함한 완전한 보고서 데이터를 반환합니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/reports/{id}`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

```http
GET /api/reports/{id}
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 보고서 ID | `456` |

### 요청 예시

```bash
# ID가 456인 보고서 조회
curl https://your-domain.com/api/reports/456
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true,
  "data": {
    "id": 456,
    "title": "ITU-T SG16 메타버스 표준화 현황",
    "date": "2024-08-24",
    "summary": "ITU-T Study Group 16에서 진행 중인 메타버스 관련 표준화 작업의 현황을 정리한 보고서입니다.",
    "content": "## 개요\n\nITU-T Study Group 16은 멀티미디어 서비스, 시스템 및 애플리케이션에 대한 표준화를 담당하는 연구반입니다.\n\n## 메타버스 관련 표준화 현황\n\n### 1. F.748.1 - Requirements for immersive services\n- 상태: 승인됨 (2023년)\n- 내용: 몰입형 서비스에 대한 요구사항\n- 주요 특징:\n  - 가상현실(VR) 서비스 요구사항\n  - 증강현실(AR) 서비스 요구사항\n  - 혼합현실(MR) 서비스 요구사항\n\n### 2. F.748.2 - Framework for immersive services\n- 상태: 개발 중 (2024년 완료 예정)\n- 내용: 몰입형 서비스 프레임워크\n- 주요 내용:\n  - 아키텍처 모델\n  - 인터페이스 정의\n  - 서비스 모델\n\n### 3. 향후 작업 계획\n\n#### 3.1 F.748.3 - Immersive service protocols\n- 계획된 시작: 2024년 하반기\n- 예상 완료: 2026년\n- 내용: 몰입형 서비스를 위한 프로토콜 표준\n\n#### 3.2 메타버스 품질 평가 방법론\n- 관련 Question: Q4/16\n- 현재 상태: 예비 연구 단계\n\n## 주요 이슈 및 도전 과제\n\n### 기술적 도전 과제\n1. **지연시간 최소화**: 실시간 상호작용을 위한 초저지연 요구사항\n2. **대역폭 효율성**: 고품질 멀티미디어 전송을 위한 효율적인 코덱 및 전송 방식\n3. **상호 운용성**: 다양한 플랫폼 간의 호환성 확보\n\n### 표준화 도전 과제\n1. **산업계 합의**: 다양한 이해관계자들 간의 의견 조율\n2. **기술 발전 속도**: 빠른 기술 변화에 대응하는 표준화 속도\n3. **글로벌 조정**: 다른 국제기구(ISO, IEEE 등)와의 협력 및 조정\n\n## 다른 국제기구와의 협력\n\n### ISO/IEC JTC1 SC24\n- 3D 그래픽스 및 이미지 처리 관련 표준\n- ITU-T와 리에종 관계 유지\n- 공통 관심 분야에서 협력 진행\n\n### IEEE Standards Association\n- IEEE 2048 시리즈: 가상현실 관련 표준\n- 기술적 상호보완성 확보를 위한 협력\n\n### 3GPP\n- 5G/6G 네트워크 기반 메타버스 서비스 지원\n- 네트워크 요구사항 공동 연구\n\n## 국내 대응 현황\n\n### 정부 정책\n- 디지털 뉴딜 2.0의 메타버스 정책\n- K-메타버스 프로젝트 추진\n- 관련 규제 샌드박스 운영\n\n### 산업계 동향\n- 주요 기업들의 메타버스 플랫폼 개발\n- 메타버스 얼라이언스 구성 및 활동\n- 국제 표준화 기여 확대\n\n### 학계 연구\n- 메타버스 관련 연구 프로젝트 증가\n- 국제 공동 연구 참여 확대\n- 표준화 전문가 양성 프로그램 운영\n\n## 결론 및 향후 전망\n\nITU-T Study Group 16에서는 메타버스 관련 표준화가 활발히 진행되고 있으며, 특히 몰입형 서비스에 대한 기본적인 프레임워크가 구축되고 있습니다. 앞으로 더욱 구체적이고 실용적인 표준들이 개발될 것으로 예상됩니다.\n\n### 주요 성과 예상\n1. **2024년 말**: F.748.2 완료로 기본 프레임워크 완성\n2. **2025년**: 프로토콜 및 인터페이스 표준 개발 본격화\n3. **2026년**: 상용 서비스 적용 가능한 표준 세트 완성\n\n### 한국의 기여 방안\n1. **적극적인 표준화 참여**: 기술 제안 및 에디터 역할 수행\n2. **산학연 협력 강화**: 국내 전문가 네트워크 구축 및 활용\n3. **국제 공조**: 다른 국가 및 기구와의 전략적 파트너십 구축\n\n메타버스 표준화는 아직 초기 단계이지만, ITU-T SG16의 체계적인 접근을 통해 향후 글로벌 메타버스 생태계의 기반이 될 중요한 표준들이 만들어질 것으로 기대됩니다.",
    "category": "표준",
    "organization": "ITU",
    "tags": ["메타버스", "ITU-T", "SG16", "표준화", "몰입형서비스"],
    "download_url": "https://example.com/reports/itu-sg16-metaverse-2024.pdf",
    "conference_id": 123,
    "created_at": "2024-08-24T10:30:00.000Z",
    "updated_at": "2024-08-24T10:30:00.000Z"
  }
}
```

### 에러 응답

#### 보고서가 존재하지 않는 경우 (404)
```json
{
  "success": false,
  "error": "Report not found"
}
```

#### 잘못된 ID 형식 (400)
```json
{
  "success": false,
  "error": "Invalid report ID"
}
```

#### 서버 오류 (500)
```json
{
  "success": false,
  "error": "Failed to get report"
}
```

## 실용적인 사용 예시

### 1. 단일 보고서 조회

```javascript
async function getReport(apiUrl, reportId) {
  try {
    const response = await fetch(`${apiUrl}/api/reports/${reportId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('보고서를 찾을 수 없습니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('보고서 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
const report = await getReport('https://your-domain.com', 456);
console.log('보고서 제목:', report.title);
console.log('작성 기관:', report.organization);
console.log('태그:', report.tags);
```

### 2. 여러 보고서 상세 정보 조회

```javascript
async function getMultipleReports(apiUrl, reportIds) {
  const reports = [];
  const errors = [];
  
  for (const id of reportIds) {
    try {
      const report = await getReport(apiUrl, id);
      reports.push(report);
    } catch (error) {
      errors.push({ id, error: error.message });
    }
    
    // API 부하 방지를 위한 지연
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { reports, errors };
}

// 사용 예시
const result = await getMultipleReports('https://your-domain.com', [456, 457, 458]);
console.log(`성공: ${result.reports.length}개`);
console.log(`실패: ${result.errors.length}개`);
```

### 3. 보고서 내용 분석

```javascript
async function analyzeReport(apiUrl, reportId) {
  const report = await getReport(apiUrl, reportId);
  
  const analysis = {
    id: report.id,
    title: report.title,
    wordCount: report.content ? report.content.length : 0,
    paragraphs: report.content ? report.content.split('\n\n').length : 0,
    headings: report.content ? (report.content.match(/^#+\s/gm) || []).length : 0,
    tags: report.tags || [],
    organization: report.organization,
    category: report.category,
    hasDownloadUrl: !!report.download_url,
    linkedToConference: !!report.conference_id
  };
  
  return analysis;
}

// 사용 예시
const analysis = await analyzeReport('https://your-domain.com', 456);
console.log('보고서 분석:', JSON.stringify(analysis, null, 2));
```

### 4. 보고서 비교

```javascript
async function compareReports(apiUrl, reportId1, reportId2) {
  const [report1, report2] = await Promise.all([
    getReport(apiUrl, reportId1),
    getReport(apiUrl, reportId2)
  ]);
  
  const comparison = {
    reports: {
      report1: { id: report1.id, title: report1.title },
      report2: { id: report2.id, title: report2.title }
    },
    organizations: {
      same: report1.organization === report2.organization,
      report1: report1.organization,
      report2: report2.organization
    },
    categories: {
      same: report1.category === report2.category,
      report1: report1.category,
      report2: report2.category
    },
    tags: {
      common: report1.tags.filter(tag => report2.tags.includes(tag)),
      unique1: report1.tags.filter(tag => !report2.tags.includes(tag)),
      unique2: report2.tags.filter(tag => !report1.tags.includes(tag))
    },
    dates: {
      report1: report1.date,
      report2: report2.date,
      daysDifference: Math.abs(
        (new Date(report1.date) - new Date(report2.date)) / (1000 * 60 * 60 * 24)
      )
    }
  };
  
  return comparison;
}

// 사용 예시
const comparison = await compareReports('https://your-domain.com', 456, 457);
console.log('공통 태그:', comparison.tags.common);
console.log('날짜 차이:', comparison.dates.daysDifference, '일');
```

### 5. 보고서 텍스트 처리

```javascript
async function extractReportData(apiUrl, reportId) {
  const report = await getReport(apiUrl, reportId);
  
  // 마크다운에서 텍스트 추출 (간단한 버전)
  const extractPlainText = (markdown) => {
    return markdown
      .replace(/^#+\s+/gm, '') // 헤딩 마크 제거
      .replace(/\*\*(.*?)\*\*/g, '$1') // 볼드 제거
      .replace(/\*(.*?)\*/g, '$1') // 이탤릭 제거
      .replace(/`(.*?)`/g, '$1') // 인라인 코드 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 제거
      .replace(/^\s*[-*+]\s+/gm, '') // 리스트 마크 제거
      .trim();
  };
  
  const plainText = extractPlainText(report.content || '');
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return {
    id: report.id,
    title: report.title,
    plainText,
    sentences: sentences.length,
    keyPhrases: extractKeyPhrases(plainText),
    wordFrequency: calculateWordFrequency(plainText)
  };
}

function extractKeyPhrases(text) {
  // 간단한 키워드 추출 (실제로는 더 정교한 NLP 라이브러리 사용 권장)
  const words = text.toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function calculateWordFrequency(text) {
  const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const frequency = {};
  
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return {
    totalWords: words.length,
    uniqueWords: Object.keys(frequency).length,
    mostCommon: Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  };
}

// 사용 예시
const extracted = await extractReportData('https://your-domain.com', 456);
console.log('주요 키워드:', extracted.keyPhrases);
console.log('총 단어 수:', extracted.wordFrequency.totalWords);
```

### 6. 보고서 백업 및 동기화

```javascript
class ReportBackup {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }
  
  async backupReport(reportId, backupPath) {
    const report = await getReport(this.apiUrl, reportId);
    const fs = require('fs').promises;
    const path = require('path');
    
    const filename = `${report.id}_${report.date}_${report.title.replace(/[^\w가-힣]/g, '_')}.json`;
    const filepath = path.join(backupPath, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`백업 완료: ${filepath}`);
    
    return filepath;
  }
  
  async backupMultipleReports(reportIds, backupPath) {
    const results = [];
    
    for (const id of reportIds) {
      try {
        const filepath = await this.backupReport(id, backupPath);
        results.push({ id, success: true, filepath });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

// 사용 예시
const backup = new ReportBackup('https://your-domain.com');
await backup.backupReport(456, './backups');

const results = await backup.backupMultipleReports([456, 457, 458], './backups');
console.log('백업 결과:', results);
```

## 응답 필드 상세 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | number | 보고서 고유 식별자 | `456` |
| `title` | string | 보고서 제목 | `"ITU-T SG16 메타버스 표준화 현황"` |
| `date` | string | 보고서 작성일 (YYYY-MM-DD) | `"2024-08-24"` |
| `summary` | string | 보고서 요약 | `"ITU-T SG16의..."` |
| `content` | string | 보고서 본문 (마크다운 형식) | `"## 개요\n\n..."` |
| `category` | string | 보고서 카테고리 | `"표준"` |
| `organization` | string | 작성 기관 | `"ITU"` |
| `tags` | string[] | 태그 배열 | `["메타버스", "ITU-T"]` |
| `download_url` | string\|null | 파일 다운로드 링크 | `"https://..."` |
| `conference_id` | number\|null | 연관된 회의 ID | `123` |
| `created_at` | string | 생성일시 (ISO 8601) | `"2024-08-24T10:30:00.000Z"` |
| `updated_at` | string | 수정일시 (ISO 8601) | `"2024-08-24T10:30:00.000Z"` |

이 API를 통해 개별 보고서의 완전한 정보를 조회하고 다양한 방식으로 활용할 수 있습니다.