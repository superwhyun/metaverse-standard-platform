# 회의 등록 API

## 개요

새로운 회의 일정을 등록합니다. 보고서와 연계되는 회의 정보를 관리할 수 있습니다.

## 기본 정보

- **HTTP 메서드**: `POST`
- **엔드포인트**: `/api/conferences`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
POST /api/conferences
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### 요청 바디

```json
{
  "title": "ITU-T SG16 Q4 메타버스 표준화 회의",
  "organization": "ITU",
  "location": "제네바, 스위스",
  "description": "메타버스 표준화 관련 분기별 정기 회의",
  "startDate": "2024-09-15",
  "endDate": "2024-09-17",
  "startTime": "09:00",
  "endTime": "17:00"
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `title` | string | ✅ | 회의 제목 | "ITU-T SG16 Q4 메타버스 표준화 회의" |
| `organization` | string | ✅ | 주관 기관 | "ITU", "ISO", "IEEE" |
| `startDate` | string | ✅ | 시작 날짜 (YYYY-MM-DD) | "2024-09-15" |
| `endDate` | string | ✅ | 종료 날짜 (YYYY-MM-DD) | "2024-09-17" |
| `location` | string | ❌ | 회의 장소 | "제네바, 스위스" |
| `description` | string | ❌ | 회의 설명 | "메타버스 표준화 관련..." |
| `startTime` | string | ❌ | 시작 시간 (HH:MM, 다일간 회의시 무시됨) | "09:00" |
| `endTime` | string | ❌ | 종료 시간 (HH:MM, 다일간 회의시 무시됨) | "17:00" |

## 응답 형식

### 성공 응답 (201)

```json
{
  "success": true,
  "data": {
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
    "hasReport": false,
    "reports": []
  }
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

#### 필수 필드 누락 (400)
```json
{
  "success": false,
  "error": "title is required"
}
```

#### 서버 오류 (500)
```json
{
  "success": false,
  "error": "Failed to create conference"
}
```

## 실용적인 사용 예시

### 1. 단일 일정 회의 등록

```bash
curl -X POST https://your-domain.com/api/conferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "메타버스 표준화 워킹그룹 월례 회의",
    "organization": "ETRI",
    "location": "대전 ETRI 본원",
    "description": "국내 메타버스 표준화 동향 논의 및 대응 방안 수립",
    "startDate": "2024-09-10",
    "endDate": "2024-09-10",
    "startTime": "14:00",
    "endTime": "16:00"
  }'
```

### 2. 다일간 회의 등록

```bash
curl -X POST https://your-domain.com/api/conferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "IEEE VR 2024 International Conference",
    "organization": "IEEE",
    "location": "올랜도, 미국",
    "description": "가상현실 및 증강현실 기술 발전과 표준화 논의",
    "startDate": "2024-03-16",
    "endDate": "2024-03-20"
  }'
```

### 3. Node.js 일괄 회의 등록

```javascript
async function bulkCreateConferences(apiUrl, token, conferences) {
  const results = [];
  
  for (const conference of conferences) {
    try {
      const response = await fetch(`${apiUrl}/api/conferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(conference)
      });

      if (response.ok) {
        const result = await response.json();
        results.push({
          success: true,
          id: result.data.id,
          title: conference.title
        });
        console.log(`✅ 회의 등록 성공: ${conference.title} (ID: ${result.data.id})`);
      } else {
        const error = await response.text();
        results.push({
          success: false,
          title: conference.title,
          error
        });
        console.log(`❌ 회의 등록 실패: ${conference.title} - ${error}`);
      }
      
      // 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      results.push({
        success: false,
        title: conference.title,
        error: error.message
      });
      console.log(`❌ 네트워크 오류: ${conference.title} - ${error.message}`);
    }
  }
  
  return results;
}

// 사용 예시
const conferences = [
  {
    title: "ITU-T SG16 Q4/16 회의",
    organization: "ITU",
    location: "제네바, 스위스",
    description: "메타버스 및 몰입형 서비스 표준화 논의",
    startDate: "2024-09-15",
    endDate: "2024-09-19"
  },
  {
    title: "ISO/IEC JTC1 SC24 총회",
    organization: "ISO",
    location: "도쿄, 일본",
    startDate: "2024-10-07",
    endDate: "2024-10-11"
  },
  {
    title: "IEEE VR 워크숍",
    organization: "IEEE",
    location: "서울, 한국",
    startDate: "2024-11-12",
    endDate: "2024-11-12",
    startTime: "09:00",
    endTime: "17:00"
  }
];

const results = await bulkCreateConferences(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  conferences
);

console.log(`등록 완료: 성공 ${results.filter(r => r.success).length}개, 실패 ${results.filter(r => !r.success).length}개`);
```

### 4. CSV에서 회의 일정 가져오기

```javascript
const csv = require('csv-parser');
const fs = require('fs');

async function importConferencesFromCSV(csvFilePath, apiUrl, token) {
  const conferences = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const conference = {
          title: row.title.trim(),
          organization: row.organization.trim(),
          location: row.location?.trim() || null,
          description: row.description?.trim() || null,
          startDate: row.startDate.trim(),
          endDate: row.endDate.trim(),
          startTime: row.startTime?.trim() || null,
          endTime: row.endTime?.trim() || null
        };
        conferences.push(conference);
      })
      .on('end', async () => {
        console.log(`CSV에서 ${conferences.length}개 회의 로드됨`);
        const results = await bulkCreateConferences(apiUrl, token, conferences);
        resolve(results);
      })
      .on('error', reject);
  });
}

// CSV 파일 형식 예시
/*
title,organization,location,description,startDate,endDate,startTime,endTime
"ITU-T SG16 Q4 회의","ITU","제네바, 스위스","메타버스 표준화 논의","2024-09-15","2024-09-19","",""
"국내 VR 포럼","ETRI","대전","VR 기술 동향 세미나","2024-09-25","2024-09-25","14:00","17:00"
*/
```

### 5. 회의와 보고서 연계 워크플로우

```javascript
async function createConferenceWithReports(apiUrl, token, conferenceData, reportsList) {
  try {
    // 1. 회의 먼저 등록
    console.log('1️⃣ 회의 등록 중...');
    const confResponse = await fetch(`${apiUrl}/api/conferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(conferenceData)
    });
    
    if (!confResponse.ok) {
      throw new Error('회의 등록 실패');
    }
    
    const confResult = await confResponse.json();
    const conferenceId = confResult.data.id;
    
    console.log(`✅ 회의 등록 성공: ${conferenceData.title} (ID: ${conferenceId})`);
    
    // 2. 관련 보고서들 등록
    console.log('2️⃣ 관련 보고서 등록 중...');
    const reportResults = [];
    
    for (const report of reportsList) {
      const reportData = {
        ...report,
        conferenceId: conferenceId  // 회의 ID 연결
      };
      
      const reportResponse = await fetch(`${apiUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
      });
      
      if (reportResponse.ok) {
        const reportResult = await reportResponse.json();
        reportResults.push({
          success: true,
          id: reportResult.data.id,
          title: report.title
        });
        console.log(`  ✅ 보고서 등록: ${report.title}`);
      } else {
        const error = await reportResponse.text();
        reportResults.push({
          success: false,
          title: report.title,
          error
        });
        console.log(`  ❌ 보고서 실패: ${report.title} - ${error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return {
      conference: { id: conferenceId, title: conferenceData.title },
      reports: reportResults
    };
    
  } catch (error) {
    console.error(`❌ 워크플로우 실패: ${error.message}`);
    throw error;
  }
}

// 사용 예시
const conferenceData = {
  title: "ITU-T SG16 메타버스 워크숍",
  organization: "ITU",
  location: "제네바",
  startDate: "2024-12-10",
  endDate: "2024-12-12"
};

const reports = [
  {
    title: "메타버스 기술 동향 보고서",
    date: "2024-12-10",
    summary: "최신 메타버스 기술 동향",
    content: "## 기술 동향...",
    category: "기술동향",
    organization: "ITU"
  },
  {
    title: "표준화 현황 보고서", 
    date: "2024-12-11",
    summary: "ITU 메타버스 표준화 현황",
    content: "## 표준화 현황...",
    category: "표준",
    organization: "ITU"
  }
];

const result = await createConferenceWithReports(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  conferenceData,
  reports
);

console.log('워크플로우 완료:', result);
```

## 데이터 유효성 검증

### 날짜 관련 규칙
- **시작일 ≤ 종료일**: 시작날짜가 종료날짜보다 늦을 수 없음
- **날짜 형식**: YYYY-MM-DD 필수
- **시간 형식**: HH:MM (24시간 형식)
- **다일간 회의**: 시작일 ≠ 종료일인 경우 시간 정보는 무시됨

### 자동 처리 로직
- `isMultiDay`: 시작일과 종료일 비교로 자동 설정
- `time`: 다일간 회의는 "종일", 단일일 회의는 "시작시간-종료시간" 형식
- `hasReport`: 초기값은 항상 false (보고서는 별도 등록)

## 일반적인 에러 및 해결책

| 에러 메시지 | 원인 | 해결책 |
|------------|------|--------|
| "title is required" | 제목 필드 누락 | title 필드 확인 |
| "startDate is required" | 시작날짜 누락 | startDate 필드 확인 |
| "endDate is required" | 종료날짜 누락 | endDate 필드 확인 |
| "관리자 권한이 필요합니다" | 인증 실패 | JWT 토큰 확인 |
| "Failed to create conference" | 서버 오류 | 잠시 후 재시도 |

이 API를 통해 체계적으로 회의 일정을 관리하고 보고서와 연계할 수 있습니다.