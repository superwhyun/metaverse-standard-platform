# 회의 상세 조회 API

## 개요

특정 회의의 상세 정보를 조회합니다. 회의 ID를 통해 개별 회의 정보와 관련 보고서를 확인할 수 있습니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/conferences/{id}`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 조회할 회의 ID | `1` |

```http
GET /api/conferences/{id}
```

### 요청 예시

```bash
curl https://your-domain.com/api/conferences/1
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "ITU-T SG16 Q.18 Meeting",
    "organization": "ITU",
    "location": "Geneva, Switzerland",
    "description": "ITU-T Study Group 16 Question 18 working group meeting discussing multimedia systems and services",
    "date": "2024-08-20",
    "startDate": "2024-08-20",
    "endDate": "2024-08-22",
    "isMultiDay": true,
    "time": "종일",
    "startTime": null,
    "endTime": null,
    "hasReport": true,
    "reports": [
      {
        "id": 123,
        "title": "ITU-T SG16 Meeting Report",
        "date": "2024-08-20",
        "summary": "Meeting outcomes and decisions"
      }
    ],
    "createdAt": "2024-08-15T10:00:00.000Z",
    "updatedAt": "2024-08-16T14:30:00.000Z"
  }
}
```

### 에러 응답

#### 회의 없음 (404)
```json
{
  "success": false,
  "error": "Conference not found"
}
```

#### 서버 오류 (500)
```json
{
  "success": false,
  "error": "Failed to fetch conference"
}
```

## 실용적인 사용 예시

### 1. 회의 상세 조회

```javascript
async function getConferenceById(apiUrl, conferenceId) {
  try {
    const response = await fetch(`${apiUrl}/api/conferences/${conferenceId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('회의를 찾을 수 없습니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '회의 조회에 실패했습니다.');
    }
    
    return result.data;
  } catch (error) {
    console.error('회의 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const conference = await getConferenceById('https://your-domain.com', 1);
  console.log('회의 정보:', conference);
  console.log('회의 제목:', conference.title);
  console.log('주최 기관:', conference.organization);
  console.log('관련 보고서:', conference.reports.length, '개');
} catch (error) {
  console.error('조회 실패:', error.message);
}
```

### 2. 회의 정보 포매팅 및 표시

```javascript
function formatConferenceInfo(conference) {
  const {
    title,
    organization,
    location,
    description,
    startDate,
    endDate,
    isMultiDay,
    startTime,
    endTime,
    hasReport,
    reports
  } = conference;
  
  // 날짜 포매팅
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };
  
  // 시간 포매팅
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };
  
  // 기간 계산
  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };
  
  const duration = calculateDuration(startDate, endDate);
  
  return {
    title,
    organization,
    location,
    description,
    schedule: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      duration: `${duration}일간`,
      isMultiDay,
      timeInfo: isMultiDay ? '종일' : `${formatTime(startTime)} - ${formatTime(endTime)}`
    },
    reports: {
      hasReport,
      count: reports.length,
      list: reports.map(report => ({
        id: report.id,
        title: report.title,
        date: formatDate(report.date),
        summary: report.summary
      }))
    }
  };
}

// 사용 예시
async function displayConferenceDetails(conferenceId) {
  try {
    const conference = await getConferenceById('https://your-domain.com', conferenceId);
    const formatted = formatConferenceInfo(conference);
    
    console.log(`📅 ${formatted.title}`);
    console.log(`🏢 주최: ${formatted.organization}`);
    console.log(`📍 장소: ${formatted.location}`);
    console.log(`📆 일정: ${formatted.schedule.startDate} ~ ${formatted.schedule.endDate} (${formatted.schedule.duration})`);
    console.log(`🕐 시간: ${formatted.schedule.timeInfo}`);
    console.log(`📄 설명: ${formatted.description}`);
    console.log(`📋 보고서: ${formatted.reports.count}개`);
    
    if (formatted.reports.hasReport) {
      console.log('\n관련 보고서:');
      formatted.reports.list.forEach((report, index) => {
        console.log(`  ${index + 1}. ${report.title} (${report.date})`);
      });
    }
    
  } catch (error) {
    console.error('회의 정보 표시 실패:', error);
  }
}

displayConferenceDetails(1);
```

### 3. 여러 회의 정보 한번에 조회

```javascript
async function getMultipleConferences(apiUrl, conferenceIds, options = {}) {
  const { batchSize = 5, includeReports = true } = options;
  
  const results = [];
  
  // 배치 단위로 처리
  for (let i = 0; i < conferenceIds.length; i += batchSize) {
    const batch = conferenceIds.slice(i, i + batchSize);
    console.log(`📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중... (${batch.length}개)`);
    
    const batchPromises = batch.map(async (conferenceId) => {
      try {
        const conference = await getConferenceById(apiUrl, conferenceId);
        return { success: true, conference };
      } catch (error) {
        return {
          success: false,
          conferenceId,
          error: error.message
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 배치 간 지연
    if (i + batchSize < conferenceIds.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  return {
    successful,
    failed,
    summary: {
      total: conferenceIds.length,
      successful: successful.length,
      failed: failed.length
    }
  };
}

// 사용 예시
const conferenceIds = [1, 2, 3, 4, 5];
const multipleConferences = await getMultipleConferences('https://your-domain.com', conferenceIds, {
  batchSize: 3,
  includeReports: true
});

console.log(`조회 완료: ${multipleConferences.summary.successful}/${multipleConferences.summary.total}개`);
multipleConferences.successful.forEach(item => {
  const conf = item.conference;
  console.log(`- ${conf.title} (${conf.organization}) - ${conf.reports.length}개 보고서`);
});
```

### 4. 회의 검색 및 필터링

```javascript
async function searchConferences(apiUrl, searchOptions = {}) {
  try {
    const {
      organization,
      location,
      startDate,
      endDate,
      hasReport,
      keyword
    } = searchOptions;
    
    // 전체 회의 목록 조회
    const allConferences = await fetch(`${apiUrl}/api/conferences`).then(r => r.json());
    
    // 각 회의의 상세 정보 조회 (병렬 처리)
    const detailedConferences = await Promise.all(
      allConferences.map(async (conf) => {
        try {
          return await getConferenceById(apiUrl, conf.id);
        } catch (error) {
          console.warn(`회의 ID ${conf.id} 조회 실패:`, error.message);
          return null;
        }
      })
    );
    
    // null 값 제거
    const validConferences = detailedConferences.filter(conf => conf !== null);
    
    // 검색 필터 적용
    let filteredConferences = validConferences;
    
    if (organization) {
      filteredConferences = filteredConferences.filter(conf =>
        conf.organization.toLowerCase().includes(organization.toLowerCase())
      );
    }
    
    if (location) {
      filteredConferences = filteredConferences.filter(conf =>
        conf.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (startDate) {
      filteredConferences = filteredConferences.filter(conf =>
        new Date(conf.startDate) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredConferences = filteredConferences.filter(conf =>
        new Date(conf.endDate) <= new Date(endDate)
      );
    }
    
    if (hasReport !== undefined) {
      filteredConferences = filteredConferences.filter(conf =>
        conf.hasReport === hasReport
      );
    }
    
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredConferences = filteredConferences.filter(conf =>
        conf.title.toLowerCase().includes(lowerKeyword) ||
        (conf.description && conf.description.toLowerCase().includes(lowerKeyword))
      );
    }
    
    return {
      total: filteredConferences.length,
      conferences: filteredConferences,
      searchOptions
    };
    
  } catch (error) {
    console.error('회의 검색 실패:', error);
    throw error;
  }
}

// 사용 예시
const searchResults = await searchConferences('https://your-domain.com', {
  organization: 'ITU',
  hasReport: true,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  keyword: 'SG16'
});

console.log(`검색 결과: ${searchResults.total}개 회의`);
searchResults.conferences.forEach(conf => {
  console.log(`- ${conf.title} (${conf.startDate})`);
});
```

### 5. 회의 캘린더 뷰 생성

```javascript
class ConferenceCalendar {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.conferences = [];
  }
  
  async loadConferences(year, month) {
    try {
      // 해당 월의 시작일과 종료일 계산
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const searchResults = await searchConferences(this.apiUrl, {
        startDate,
        endDate
      });
      
      this.conferences = searchResults.conferences;
      return this.conferences;
      
    } catch (error) {
      console.error('회의 로딩 실패:', error);
      throw error;
    }
  }
  
  getConferencesByDate(dateString) {
    return this.conferences.filter(conf => {
      const confStartDate = conf.startDate;
      const confEndDate = conf.endDate;
      
      // 해당 날짜가 회의 기간에 포함되는지 확인
      return dateString >= confStartDate && dateString <= confEndDate;
    });
  }
  
  generateCalendarData(year, month) {
    const calendar = {};
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayConferences = this.getConferencesByDate(dateString);
      
      calendar[dateString] = {
        date: dateString,
        day: day,
        conferences: dayConferences,
        hasConferences: dayConferences.length > 0,
        conferenceCount: dayConferences.length
      };
    }
    
    return calendar;
  }
  
  getUpcomingConferences(days = 7) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.conferences.filter(conf => {
      const confDate = new Date(conf.startDate);
      return confDate >= today && confDate <= futureDate;
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }
  
  getConferenceStats() {
    const stats = {
      total: this.conferences.length,
      withReports: this.conferences.filter(c => c.hasReport).length,
      multiDay: this.conferences.filter(c => c.isMultiDay).length,
      organizations: {},
      locations: {}
    };
    
    this.conferences.forEach(conf => {
      // 조직별 통계
      stats.organizations[conf.organization] = 
        (stats.organizations[conf.organization] || 0) + 1;
      
      // 지역별 통계
      stats.locations[conf.location] = 
        (stats.locations[conf.location] || 0) + 1;
    });
    
    return stats;
  }
  
  exportToICS() {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Metaverse Platform//Conference Calendar//EN',
      'CALSCALE:GREGORIAN'
    ];
    
    this.conferences.forEach(conf => {
      const startDate = new Date(conf.startDate + (conf.startTime ? `T${conf.startTime}` : 'T09:00'));
      const endDate = new Date(conf.endDate + (conf.endTime ? `T${conf.endTime}` : 'T17:00'));
      
      const formatDateForICS = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:conference-${conf.id}@metaverse-platform.com`,
        `DTSTART:${formatDateForICS(startDate)}`,
        `DTEND:${formatDateForICS(endDate)}`,
        `SUMMARY:${conf.title}`,
        `DESCRIPTION:${conf.description || ''}`,
        `LOCATION:${conf.location}`,
        `ORGANIZER:${conf.organization}`,
        'END:VEVENT'
      );
    });
    
    icsContent.push('END:VCALENDAR');
    
    return icsContent.join('\r\n');
  }
}

// 사용 예시
const calendar = new ConferenceCalendar('https://your-domain.com');

// 2024년 8월 회의 로드
await calendar.loadConferences(2024, 8);

// 캘린더 데이터 생성
const calendarData = calendar.generateCalendarData(2024, 8);
console.log('8월 1일 회의:', calendarData['2024-08-01'].conferences);

// 다가오는 회의
const upcoming = calendar.getUpcomingConferences(7);
console.log('다음 7일간 예정 회의:', upcoming.map(c => c.title));

// 통계
const stats = calendar.getConferenceStats();
console.log('회의 통계:', stats);

// ICS 파일 내보내기
const icsData = calendar.exportToICS();
console.log('ICS 데이터 생성 완료');
```

### 6. 회의 정보 캐싱 시스템

```javascript
class ConferenceCache {
  constructor(apiUrl, cacheTimeout = 10 * 60 * 1000) { // 10분 캐시
    this.apiUrl = apiUrl;
    this.cache = new Map();
    this.cacheTimeout = cacheTimeout;
  }
  
  async getConference(conferenceId, forceRefresh = false) {
    const cacheKey = `conf_${conferenceId}`;
    const now = Date.now();
    
    // 캐시 확인
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      
      if (now - timestamp < this.cacheTimeout) {
        console.log(`📋 캐시에서 조회: ${data.title}`);
        return data;
      }
    }
    
    try {
      // API에서 최신 데이터 조회
      const conference = await getConferenceById(this.apiUrl, conferenceId);
      
      // 캐시에 저장
      this.cache.set(cacheKey, {
        data: conference,
        timestamp: now
      });
      
      console.log(`🔄 API에서 조회: ${conference.title}`);
      return conference;
      
    } catch (error) {
      // API 실패 시 오래된 캐시라도 반환
      if (this.cache.has(cacheKey)) {
        const { data } = this.cache.get(cacheKey);
        console.log(`⚠️  API 실패, 캐시 데이터 사용: ${data.title}`);
        return data;
      }
      throw error;
    }
  }
  
  clearCache(conferenceId = null) {
    if (conferenceId) {
      this.cache.delete(`conf_${conferenceId}`);
    } else {
      this.cache.clear();
    }
  }
  
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, { timestamp }] of this.cache) {
      if (now - timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

// 사용 예시
const conferenceCache = new ConferenceCache('https://your-domain.com', 5 * 60 * 1000); // 5분 캐시

// 첫 번째 조회 (API에서)
const conference1 = await conferenceCache.getConference(1);
console.log('첫 번째 조회:', conference1.title);

// 두 번째 조회 (캐시에서)
const conference2 = await conferenceCache.getConference(1);
console.log('두 번째 조회:', conference2.title);

// 캐시 통계
console.log('캐시 통계:', conferenceCache.getCacheStats());
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `success` | boolean | 요청 성공 여부 | `true` |
| `data.id` | number | 회의 고유 ID | `1` |
| `data.title` | string | 회의 제목 | `"ITU-T SG16 Q.18 Meeting"` |
| `data.organization` | string | 주최 기관 | `"ITU"` |
| `data.location` | string | 개최 장소 | `"Geneva, Switzerland"` |
| `data.description` | string | 회의 설명 | `"ITU-T Study Group 16..."` |
| `data.date` | string | 회의 날짜 (시작일) | `"2024-08-20"` |
| `data.startDate` | string | 시작 날짜 | `"2024-08-20"` |
| `data.endDate` | string | 종료 날짜 | `"2024-08-22"` |
| `data.isMultiDay` | boolean | 다일간 회의 여부 | `true` |
| `data.time` | string | 시간 정보 | `"종일"` 또는 `"09:00-17:00"` |
| `data.startTime` | string\|null | 시작 시간 | `"09:00"` 또는 `null` |
| `data.endTime` | string\|null | 종료 시간 | `"17:00"` 또는 `null` |
| `data.hasReport` | boolean | 관련 보고서 존재 여부 | `true` |
| `data.reports` | array | 관련 보고서 목록 | `[{...}]` |
| `data.createdAt` | string | 생성 일시 | `"2024-08-15T10:00:00.000Z"` |
| `data.updatedAt` | string | 수정 일시 | `"2024-08-16T14:30:00.000Z"` |

이 API를 통해 특정 회의의 상세 정보를 효율적으로 조회하고 활용할 수 있습니다.