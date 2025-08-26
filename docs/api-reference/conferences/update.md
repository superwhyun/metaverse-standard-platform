# 회의 수정 API

## 개요

기존 회의의 정보를 수정합니다. 회의 제목, 일정, 장소, 설명 등을 변경할 수 있으며, 관리자 권한이 필요합니다.

## 기본 정보

- **HTTP 메서드**: `PUT`
- **엔드포인트**: `/api/conferences/{id}`
- **인증**: 관리자 권한 필요 (JWT 토큰)
- **Content-Type**: `application/json`

## 요청 형식

### 헤더
```http
PUT /api/conferences/{id}
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `id` | number | ✅ | 수정할 회의 ID | `1` |

### 요청 본문

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `title` | string | ❌ | 회의 제목 | `"ITU-T SG16 Q.18 Interim Meeting"` |
| `organization` | string | ❌ | 주최 기관 | `"ITU"` |
| `location` | string | ❌ | 개최 장소 | `"Virtual Meeting"` |
| `description` | string | ❌ | 회의 설명 | `"Virtual interim meeting for Q.18"` |
| `startDate` | string | ❌ | 시작 날짜 (YYYY-MM-DD) | `"2024-09-15"` |
| `endDate` | string | ❌ | 종료 날짜 (YYYY-MM-DD) | `"2024-09-16"` |
| `startTime` | string | ❌ | 시작 시간 (HH:MM, 단일일만) | `"09:00"` |
| `endTime` | string | ❌ | 종료 시간 (HH:MM, 단일일만) | `"17:00"` |

> **주의**: `startDate`와 `endDate`를 제공하는 경우 두 필드 모두 필요합니다. 다일간 회의인 경우 시간 필드는 무시됩니다.

### 요청 예시

```bash
curl -X PUT https://your-domain.com/api/conferences/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "ITU-T SG16 Q.18 Interim Meeting",
    "location": "Virtual Meeting",
    "startDate": "2024-09-15",
    "endDate": "2024-09-16",
    "startTime": "14:00",
    "endTime": "18:00"
  }'
```

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "ITU-T SG16 Q.18 Interim Meeting",
    "organization": "ITU",
    "location": "Virtual Meeting",
    "description": "Virtual interim meeting for Q.18",
    "date": "2024-09-15",
    "startDate": "2024-09-15",
    "endDate": "2024-09-16",
    "isMultiDay": true,
    "time": "종일",
    "startTime": null,
    "endTime": null,
    "hasReport": true,
    "reports": [],
    "createdAt": "2024-08-15T10:00:00.000Z",
    "updatedAt": "2024-08-25T15:30:00.000Z"
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
  "error": "Failed to update conference"
}
```

## 실용적인 사용 예시

### 1. JavaScript로 회의 수정

```javascript
async function updateConference(apiUrl, token, conferenceId, updateData) {
  try {
    const response = await fetch(`${apiUrl}/api/conferences/${conferenceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('회의를 찾을 수 없습니다.');
      }
      if (response.status === 401) {
        throw new Error('관리자 권한이 필요합니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '회의 수정에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    console.error('회의 수정 실패:', error);
    throw error;
  }
}

// 사용 예시
try {
  const updatedConference = await updateConference('https://your-domain.com', 'YOUR_JWT_TOKEN', 1, {
    title: 'ITU-T SG16 Q.18 Interim Meeting',
    location: 'Virtual Meeting',
    startDate: '2024-09-15',
    endDate: '2024-09-16'
  });
  console.log('✅ 회의 수정 성공:', updatedConference);
} catch (error) {
  console.error('❌ 수정 실패:', error.message);
}
```

### 2. 안전한 회의 수정

```javascript
async function safeUpdateConference(apiUrl, token, conferenceId, updateData) {
  try {
    // 1. 기존 회의 정보 조회
    console.log(`🔍 회의 ID ${conferenceId} 현재 정보 조회 중...`);
    const currentConference = await fetch(`${apiUrl}/api/conferences/${conferenceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    if (!currentConference.success) {
      throw new Error('수정하려는 회의를 찾을 수 없습니다.');
    }

    const current = currentConference.data;

    console.log('📋 현재 회의 정보:');
    console.log(`  제목: ${current.title}`);
    console.log(`  주최: ${current.organization}`);
    console.log(`  장소: ${current.location}`);
    console.log(`  기간: ${current.startDate} ~ ${current.endDate}`);

    // 2. 변경사항 확인
    const changes = {};
    if (updateData.title && updateData.title !== current.title) {
      changes.title = { from: current.title, to: updateData.title };
    }
    if (updateData.organization && updateData.organization !== current.organization) {
      changes.organization = { from: current.organization, to: updateData.organization };
    }
    if (updateData.location && updateData.location !== current.location) {
      changes.location = { from: current.location, to: updateData.location };
    }
    if (updateData.startDate && updateData.startDate !== current.startDate) {
      changes.startDate = { from: current.startDate, to: updateData.startDate };
    }
    if (updateData.endDate && updateData.endDate !== current.endDate) {
      changes.endDate = { from: current.endDate, to: updateData.endDate };
    }

    if (Object.keys(changes).length === 0) {
      console.log('ℹ️  변경사항이 없습니다.');
      return { success: true, conference: current, noChanges: true };
    }

    console.log('📝 변경사항:');
    Object.entries(changes).forEach(([field, change]) => {
      console.log(`  ${field}: "${change.from}" → "${change.to}"`);
    });

    // 3. 날짜 유효성 검사
    if (updateData.startDate && updateData.endDate) {
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);
      
      if (startDate > endDate) {
        throw new Error('시작 날짜가 종료 날짜보다 늦을 수 없습니다.');
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        console.warn('⚠️  과거 날짜로 회의를 수정하고 있습니다.');
      }
    }

    // 4. 관련 보고서 확인
    if (current.hasReport && current.reports.length > 0) {
      console.log(`📋 이 회의에는 ${current.reports.length}개의 관련 보고서가 있습니다.`);
      console.log('   회의 정보 변경이 보고서 링크에 영향을 줄 수 있습니다.');
    }

    // 5. 실제 수정 실행
    console.log('🔄 회의 수정 중...');
    const updatedConference = await updateConference(apiUrl, token, conferenceId, updateData);

    console.log('✅ 회의 수정 완료');
    return {
      success: true,
      conference: updatedConference,
      changes,
      previousConference: current
    };

  } catch (error) {
    console.error('❌ 안전 수정 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 사용 예시
const result = await safeUpdateConference('https://your-domain.com', 'YOUR_JWT_TOKEN', 1, {
  title: 'ITU-T SG16 Q.18 Interim Meeting',
  location: 'Virtual Meeting',
  startDate: '2024-09-15',
  endDate: '2024-09-16'
});

if (result.success && !result.noChanges) {
  console.log('변경된 회의:', result.conference.title);
}
```

### 3. 일괄 회의 수정

```javascript
async function bulkUpdateConferences(apiUrl, token, updates, options = {}) {
  const { 
    batchSize = 5, 
    delay = 1000,
    safeMode = true 
  } = options;
  
  const results = [];
  
  console.log(`📦 ${updates.length}개 회의 일괄 수정 시작`);
  
  // 배치 단위로 처리
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    console.log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개)`);

    for (const updateItem of batch) {
      const { conferenceId, ...updateData } = updateItem;
      
      try {
        let result;
        if (safeMode) {
          result = await safeUpdateConference(apiUrl, token, conferenceId, updateData);
        } else {
          const updatedConference = await updateConference(apiUrl, token, conferenceId, updateData);
          result = { success: true, conference: updatedConference };
        }
        
        if (result.success) {
          if (result.noChanges) {
            console.log(`  ➡️  변경사항 없음: ID ${conferenceId}`);
          } else {
            console.log(`  ✅ 수정 완료: ${result.conference.title} (ID: ${conferenceId})`);
          }
        }
        
        results.push({ ...result, conferenceId });

      } catch (error) {
        results.push({
          success: false,
          conferenceId,
          error: error.message
        });
        console.log(`  ❌ 수정 실패: ID ${conferenceId} - ${error.message}`);
      }

      // 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 200));
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
const conferencesToUpdate = [
  {
    conferenceId: 1,
    title: 'ITU-T SG16 Q.18 Interim Meeting',
    location: 'Virtual Meeting'
  },
  {
    conferenceId: 2,
    startDate: '2024-10-01',
    endDate: '2024-10-03'
  },
  {
    conferenceId: 3,
    organization: 'IEEE',
    description: 'Updated meeting description'
  }
];

const bulkResult = await bulkUpdateConferences(
  'https://your-domain.com', 
  'YOUR_JWT_TOKEN', 
  conferencesToUpdate,
  {
    batchSize: 2,
    delay: 1500,
    safeMode: true
  }
);
```

### 4. 회의 일정 재조정

```javascript
async function rescheduleConference(apiUrl, token, conferenceId, newSchedule) {
  try {
    const { startDate, endDate, startTime, endTime, reason } = newSchedule;
    
    // 1. 기존 회의 정보 조회
    const currentConference = await fetch(`${apiUrl}/api/conferences/${conferenceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    if (!currentConference.success) {
      throw new Error('회의를 찾을 수 없습니다.');
    }

    const current = currentConference.data;
    
    // 2. 일정 변경 검증
    const oldStart = new Date(current.startDate);
    const oldEnd = new Date(current.endDate);
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    
    console.log(`📅 회의 일정 변경: ${current.title}`);
    console.log(`   기존: ${current.startDate} ~ ${current.endDate}`);
    console.log(`   신규: ${startDate} ~ ${endDate}`);
    if (reason) {
      console.log(`   사유: ${reason}`);
    }
    
    // 3. 날짜 유효성 검사
    if (newStart > newEnd) {
      throw new Error('시작 날짜가 종료 날짜보다 늦을 수 없습니다.');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newStart < today) {
      throw new Error('과거 날짜로는 회의를 재조정할 수 없습니다.');
    }
    
    // 4. 다일간 회의 여부 확인
    const isMultiDay = newStart.toDateString() !== newEnd.toDateString();
    
    const updateData = {
      startDate,
      endDate
    };
    
    // 단일일 회의인 경우만 시간 설정
    if (!isMultiDay) {
      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
    }
    
    // 5. 회의 업데이트
    const updatedConference = await updateConference(apiUrl, token, conferenceId, updateData);
    
    // 6. 재조정 기록 생성 (선택적)
    const rescheduleRecord = {
      conferenceId,
      oldSchedule: {
        startDate: current.startDate,
        endDate: current.endDate,
        startTime: current.startTime,
        endTime: current.endTime
      },
      newSchedule: {
        startDate: updatedConference.startDate,
        endDate: updatedConference.endDate,
        startTime: updatedConference.startTime,
        endTime: updatedConference.endTime
      },
      reason,
      rescheduledAt: new Date().toISOString()
    };
    
    console.log('✅ 회의 일정이 성공적으로 변경되었습니다.');
    
    return {
      success: true,
      conference: updatedConference,
      rescheduleRecord
    };
    
  } catch (error) {
    console.error('❌ 일정 재조정 실패:', error.message);
    throw error;
  }
}

// 사용 예시
const rescheduleResult = await rescheduleConference(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  1,
  {
    startDate: '2024-10-15',
    endDate: '2024-10-16',
    startTime: '10:00',
    endTime: '16:00',
    reason: '참석자 일정 조정으로 인한 연기'
  }
);

if (rescheduleResult.success) {
  console.log('재조정된 회의:', rescheduleResult.conference.title);
}
```

### 5. 회의 장소 변경 (오프라인 ↔ 온라인)

```javascript
async function changeConferenceFormat(apiUrl, token, conferenceId, newFormat) {
  try {
    const formats = {
      online: {
        location: 'Virtual Meeting',
        description: 'Online virtual meeting'
      },
      hybrid: {
        location: 'Hybrid (On-site + Virtual)',
        description: 'Hybrid meeting with both on-site and virtual participation'
      },
      offline: {
        location: '', // 사용자가 지정
        description: 'On-site meeting'
      }
    };
    
    const { format, customLocation, customDescription } = newFormat;
    
    if (!formats[format]) {
      throw new Error('지원하지 않는 회의 형태입니다. (online, hybrid, offline)');
    }
    
    // 1. 기존 회의 정보 조회
    const currentConference = await fetch(`${apiUrl}/api/conferences/${conferenceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    if (!currentConference.success) {
      throw new Error('회의를 찾을 수 없습니다.');
    }

    const current = currentConference.data;
    
    // 2. 새로운 형태에 따른 설정
    let updateData = {};
    
    switch (format) {
      case 'online':
        updateData = {
          location: formats.online.location,
          description: current.description + ' (온라인으로 변경)'
        };
        break;
        
      case 'hybrid':
        updateData = {
          location: formats.hybrid.location,
          description: current.description + ' (하이브리드로 변경)'
        };
        break;
        
      case 'offline':
        if (!customLocation) {
          throw new Error('오프라인 회의의 경우 장소를 지정해야 합니다.');
        }
        updateData = {
          location: customLocation,
          description: customDescription || current.description + ' (오프라인으로 변경)'
        };
        break;
    }
    
    console.log(`🔄 회의 형태 변경: ${current.title}`);
    console.log(`   기존 장소: ${current.location}`);
    console.log(`   새로운 장소: ${updateData.location}`);
    console.log(`   형태: ${format.toUpperCase()}`);
    
    // 3. 회의 업데이트
    const updatedConference = await updateConference(apiUrl, token, conferenceId, updateData);
    
    console.log('✅ 회의 형태가 성공적으로 변경되었습니다.');
    
    return {
      success: true,
      conference: updatedConference,
      formatChange: {
        from: current.location,
        to: updateData.location,
        format
      }
    };
    
  } catch (error) {
    console.error('❌ 회의 형태 변경 실패:', error.message);
    throw error;
  }
}

// 사용 예시들

// 온라인으로 변경
const onlineResult = await changeConferenceFormat(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  1,
  { format: 'online' }
);

// 하이브리드로 변경
const hybridResult = await changeConferenceFormat(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  2,
  { format: 'hybrid' }
);

// 오프라인으로 변경
const offlineResult = await changeConferenceFormat(
  'https://your-domain.com',
  'YOUR_JWT_TOKEN',
  3,
  { 
    format: 'offline',
    customLocation: 'Seoul Convention Center, Room A',
    customDescription: 'In-person meeting at Seoul Convention Center'
  }
);
```

### 6. 회의 수정 이력 관리

```javascript
class ConferenceUpdateManager {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.updateHistory = [];
  }
  
  async updateWithHistory(conferenceId, updateData, metadata = {}) {
    try {
      // 1. 기존 회의 정보 백업
      const originalConference = await fetch(`${this.apiUrl}/api/conferences/${conferenceId}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }).then(r => r.json());
      
      if (!originalConference.success) {
        throw new Error('회의를 찾을 수 없습니다.');
      }
      
      const original = originalConference.data;
      
      // 2. 변경사항 분석
      const changes = this.analyzeChanges(original, updateData);
      
      // 3. 회의 업데이트
      const updatedConference = await updateConference(this.apiUrl, this.token, conferenceId, updateData);
      
      // 4. 이력 기록
      const historyEntry = {
        id: Date.now(),
        conferenceId,
        timestamp: new Date().toISOString(),
        original,
        updated: updatedConference,
        changes,
        metadata: {
          updatedBy: metadata.updatedBy || 'system',
          reason: metadata.reason || '',
          source: metadata.source || 'api',
          ...metadata
        }
      };
      
      this.updateHistory.push(historyEntry);
      
      console.log(`📝 회의 수정 이력 기록: ${updatedConference.title}`);
      console.log(`   변경사항: ${Object.keys(changes).join(', ')}`);
      
      return {
        success: true,
        conference: updatedConference,
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
      let originalValue;
      
      // 필드 매핑
      switch (key) {
        case 'startDate':
          originalValue = original.startDate;
          break;
        case 'endDate':
          originalValue = original.endDate;
          break;
        case 'startTime':
          originalValue = original.startTime;
          break;
        case 'endTime':
          originalValue = original.endTime;
          break;
        default:
          originalValue = original[key];
      }
      
      if (newValue !== originalValue) {
        changes[key] = {
          from: originalValue,
          to: newValue
        };
      }
    });
    
    return changes;
  }
  
  getHistory(conferenceId = null) {
    if (conferenceId) {
      return this.updateHistory.filter(entry => entry.conferenceId === conferenceId);
    }
    return this.updateHistory;
  }
  
  getRecentUpdates(hours = 24) {
    const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.updateHistory.filter(entry => 
      new Date(entry.timestamp) >= cutoff
    );
  }
  
  exportHistory() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEntries: this.updateHistory.length,
      history: this.updateHistory
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  clearHistory() {
    const count = this.updateHistory.length;
    this.updateHistory = [];
    console.log(`🗑️  ${count}개 수정 이력 삭제`);
  }
}

// 사용 예시
const updateManager = new ConferenceUpdateManager('https://your-domain.com', 'YOUR_JWT_TOKEN');

// 이력과 함께 업데이트
const updateResult = await updateManager.updateWithHistory(1, {
  title: 'Updated Conference Title',
  location: 'New Location'
}, {
  updatedBy: 'admin@example.com',
  reason: '장소 변경으로 인한 정보 수정',
  source: 'admin_panel'
});

// 특정 회의의 수정 이력 조회
const conferenceHistory = updateManager.getHistory(1);
console.log('회의 수정 이력:', conferenceHistory);

// 최근 24시간 내 수정사항
const recentUpdates = updateManager.getRecentUpdates(24);
console.log('최근 업데이트:', recentUpdates);

// 이력 내보내기
const historyData = updateManager.exportHistory();
console.log('이력 데이터 내보내기 완료');
```

## 응답 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `success` | boolean | 요청 성공 여부 | `true` |
| `data` | object | 수정된 회의 정보 | 회의 상세 조회 API와 동일 |

## 주의사항

- 회의 수정은 관리자 권한이 필요합니다
- `startDate`와 `endDate`를 수정하는 경우 두 필드 모두 제공해야 합니다
- 다일간 회의의 경우 시간 필드(`startTime`, `endTime`)는 무시됩니다
- 이미 시작된 회의의 일정을 수정할 때는 신중하게 검토하세요

이 API를 통해 회의 정보를 안전하고 효율적으로 관리할 수 있습니다.