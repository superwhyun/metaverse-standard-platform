# 회의 목록 조회 API

## 개요

등록된 회의 목록을 조회합니다. 월별 필터링, 날짜 범위 검색을 지원합니다.

## 기본 정보

- **HTTP 메서드**: `GET`
- **엔드포인트**: `/api/conferences`
- **인증**: 불필요 (공개 API)
- **Content-Type**: `application/json`

## 요청 형식

### 기본 요청
```http
GET /api/conferences
```

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `year` | number | ❌ | 필터링할 연도 | `year=2024` |
| `month` | number | ❌ | 필터링할 월 (1-12) | `month=9` |
| `startDate` | string | ❌ | 검색 시작일 (YYYY-MM-DD) | `startDate=2024-09-01` |
| `endDate` | string | ❌ | 검색 종료일 (YYYY-MM-DD) | `endDate=2024-09-30` |

### 요청 예시

```bash
# 모든 회의 조회
curl https://your-domain.com/api/conferences

# 2024년 9월 회의만 조회
curl "https://your-domain.com/api/conferences?year=2024&month=9"

# 특정 기간 회의 조회
curl "https://your-domain.com/api/conferences?startDate=2024-09-01&endDate=2024-09-30"
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true,
  "data": [
    {
      "id": 124,
      "title": "ITU-T SG16 Q4 메타버스 표준화 회의",
      "organization": "ITU",
      "location": "제네바, 스위스",
      "description": "메타버스 표준화 관련 분기별 정기 회의",
      "date": "2024-09-15",
      "startDate": "2024-09-15",
      "endDate": "2024-09-17",
      "isMultiDay": true,
      "time": "종일",
      "startTime": null,
      "endTime": null,
      "hasReport": true,
      "reports": [
        {
          "id": 456,
          "title": "ITU-T SG16 메타버스 표준화 현황"
        }
      ],
      "createdAt": "2024-08-24T10:30:00.000Z",
      "updatedAt": "2024-08-24T10:30:00.000Z"
    },
    {
      "id": 123,
      "title": "국내 VR 기술 포럼",
      "organization": "ETRI",
      "location": "대전 ETRI 본원",
      "description": "VR 기술 동향 및 표준화 논의",
      "date": "2024-09-25",
      "startDate": "2024-09-25",
      "endDate": "2024-09-25",
      "isMultiDay": false,
      "time": "14:00-17:00",
      "startTime": "14:00",
      "endTime": "17:00",
      "hasReport": false,
      "reports": [],
      "createdAt": "2024-08-23T09:15:00.000Z",
      "updatedAt": "2024-08-23T09:15:00.000Z"
    }
  ]
}
```

### 에러 응답 (500)
```json
{
  "success": false,
  "error": "Failed to fetch conferences"
}
```

## 실용적인 사용 예시

### 1. 모든 회의 목록 조회

```javascript
async function getAllConferences(apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/api/conferences`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('회의 목록 조회 실패:', error);
    throw error;
  }
}

// 사용
const conferences = await getAllConferences('https://your-domain.com');
console.log(`총 ${conferences.length}개의 회의가 등록되어 있습니다.`);
```

### 2. 월별 회의 일정 조회

```javascript
async function getMonthlyConferences(apiUrl, year, month) {
  const response = await fetch(
    `${apiUrl}/api/conferences?year=${year}&month=${month}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

// 2024년 9월 회의 일정
const septemberConferences = await getMonthlyConferences('https://your-domain.com', 2024, 9);
console.log(`9월 회의 일정: ${septemberConferences.length}개`);

// 월별 통계 생성
async function generateMonthlyStats(apiUrl, year) {
  const monthlyStats = {};
  
  for (let month = 1; month <= 12; month++) {
    const conferences = await getMonthlyConferences(apiUrl, year, month);
    monthlyStats[month] = {
      count: conferences.length,
      organizations: [...new Set(conferences.map(c => c.organization))],
      withReports: conferences.filter(c => c.hasReport).length
    };
  }
  
  return monthlyStats;
}
```

### 3. 기관별 회의 분석

```javascript
async function analyzeConferencesByOrganization(apiUrl) {
  const conferences = await getAllConferences(apiUrl);
  const analysis = {};
  
  conferences.forEach(conference => {
    const org = conference.organization;
    
    if (!analysis[org]) {
      analysis[org] = {
        total: 0,
        upcoming: 0,
        withReports: 0,
        locations: new Set(),
        conferences: []
      };
    }
    
    analysis[org].total++;
    analysis[org].conferences.push({
      id: conference.id,
      title: conference.title,
      date: conference.startDate,
      hasReport: conference.hasReport
    });
    
    if (conference.hasReport) {
      analysis[org].withReports++;
    }
    
    if (conference.location) {
      analysis[org].locations.add(conference.location);
    }
    
    // 향후 일정인지 확인
    const conferenceDate = new Date(conference.startDate);
    const today = new Date();
    if (conferenceDate > today) {
      analysis[org].upcoming++;
    }
  });
  
  // Set을 Array로 변환
  Object.keys(analysis).forEach(org => {
    analysis[org].locations = Array.from(analysis[org].locations);
  });
  
  return analysis;
}

// 사용 예시
const orgAnalysis = await analyzeConferencesByOrganization('https://your-domain.com');
console.log('기관별 회의 현황:');
Object.entries(orgAnalysis).forEach(([org, stats]) => {
  console.log(`${org}: 총 ${stats.total}개, 예정 ${stats.upcoming}개, 보고서 있음 ${stats.withReports}개`);
});
```

### 4. 회의 달력 생성

```javascript
async function generateConferenceCalendar(apiUrl, year, month) {
  const conferences = await getMonthlyConferences(apiUrl, year, month);
  
  // 날짜별로 그룹화
  const calendar = {};
  
  conferences.forEach(conference => {
    const startDate = conference.startDate;
    const endDate = conference.endDate;
    
    // 다일간 회의 처리
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      
      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }
      
      calendar[dateKey].push({
        id: conference.id,
        title: conference.title,
        organization: conference.organization,
        location: conference.location,
        time: conference.time,
        isStart: dateKey === startDate,
        isEnd: dateKey === endDate,
        isMultiDay: conference.isMultiDay
      });
    }
  });
  
  return calendar;
}

// HTML 달력 생성
async function generateHTMLCalendar(apiUrl, year, month) {
  const calendar = await generateConferenceCalendar(apiUrl, year, month);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  let html = `<div class="calendar">
    <h2>${year}년 ${month}월 회의 일정</h2>
    <div class="calendar-grid">`;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayConferences = calendar[dateKey] || [];
    
    html += `<div class="calendar-day">
      <div class="day-number">${day}</div>`;
    
    dayConferences.forEach(conf => {
      html += `<div class="conference-item" data-id="${conf.id}">
        <div class="conference-title">${conf.title}</div>
        <div class="conference-org">${conf.organization}</div>
        <div class="conference-time">${conf.time}</div>
      </div>`;
    });
    
    html += `</div>`;
  }
  
  html += `</div></div>`;
  return html;
}
```

### 5. 보고서가 있는 회의 찾기

```javascript
async function getConferencesWithReports(apiUrl) {
  const conferences = await getAllConferences(apiUrl);
  
  const conferencesWithReports = conferences.filter(conference => 
    conference.hasReport && conference.reports.length > 0
  );
  
  return conferencesWithReports.map(conference => ({
    id: conference.id,
    title: conference.title,
    organization: conference.organization,
    date: conference.startDate,
    reportsCount: conference.reports.length,
    reports: conference.reports.map(report => ({
      id: report.id,
      title: report.title
    }))
  }));
}

// 보고서별 회의 정보 조회
async function getReportConferenceMapping(apiUrl) {
  const conferencesWithReports = await getConferencesWithReports(apiUrl);
  const mapping = {};
  
  conferencesWithReports.forEach(conference => {
    conference.reports.forEach(report => {
      mapping[report.id] = {
        conferenceId: conference.id,
        conferenceTitle: conference.title,
        conferenceDate: conference.date,
        organization: conference.organization
      };
    });
  });
  
  return mapping;
}

// 사용 예시
const withReports = await getConferencesWithReports('https://your-domain.com');
console.log(`보고서가 있는 회의: ${withReports.length}개`);

withReports.forEach(conf => {
  console.log(`${conf.title} (${conf.date}): ${conf.reportsCount}개 보고서`);
});
```

### 6. 향후 일정 알림

```javascript
async function getUpcomingConferences(apiUrl, daysAhead = 30) {
  const conferences = await getAllConferences(apiUrl);
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);
  
  const upcoming = conferences.filter(conference => {
    const conferenceDate = new Date(conference.startDate);
    return conferenceDate >= today && conferenceDate <= futureDate;
  }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  return upcoming.map(conference => {
    const conferenceDate = new Date(conference.startDate);
    const daysUntil = Math.ceil((conferenceDate - today) / (1000 * 60 * 60 * 24));
    
    return {
      ...conference,
      daysUntil,
      urgency: daysUntil <= 7 ? 'high' : daysUntil <= 14 ? 'medium' : 'low'
    };
  });
}

// 알림 메시지 생성
async function generateUpcomingNotifications(apiUrl) {
  const upcoming = await getUpcomingConferences(apiUrl, 30);
  const notifications = [];
  
  upcoming.forEach(conference => {
    let message = '';
    
    if (conference.daysUntil === 0) {
      message = `🔴 오늘: ${conference.title} (${conference.organization})`;
    } else if (conference.daysUntil === 1) {
      message = `🟡 내일: ${conference.title} (${conference.organization})`;
    } else if (conference.daysUntil <= 7) {
      message = `🟠 ${conference.daysUntil}일 후: ${conference.title} (${conference.organization})`;
    } else {
      message = `🟢 ${conference.daysUntil}일 후: ${conference.title} (${conference.organization})`;
    }
    
    notifications.push({
      message,
      urgency: conference.urgency,
      conferenceId: conference.id,
      date: conference.startDate
    });
  });
  
  return notifications;
}

// 사용 예시
const notifications = await generateUpcomingNotifications('https://your-domain.com');
notifications.forEach(notif => console.log(notif.message));
```

## 응답 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 회의 고유 ID |
| `title` | string | 회의 제목 |
| `organization` | string | 주관 기관 |
| `location` | string\|null | 회의 장소 |
| `description` | string\|null | 회의 설명 |
| `date` | string | 대표 날짜 (시작일과 동일) |
| `startDate` | string | 시작 날짜 (YYYY-MM-DD) |
| `endDate` | string | 종료 날짜 (YYYY-MM-DD) |
| `isMultiDay` | boolean | 다일간 회의 여부 |
| `time` | string | 시간 정보 ("종일" 또는 "HH:MM-HH:MM") |
| `startTime` | string\|null | 시작 시간 (HH:MM) |
| `endTime` | string\|null | 종료 시간 (HH:MM) |
| `hasReport` | boolean | 관련 보고서 존재 여부 |
| `reports` | array | 관련 보고서 목록 |
| `createdAt` | string | 생성일시 (ISO 8601) |
| `updatedAt` | string | 수정일시 (ISO 8601) |

이 API를 통해 회의 일정을 효율적으로 조회하고 관리할 수 있습니다.