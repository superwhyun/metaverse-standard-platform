# 인증 가이드

## 개요

메타버스 국제표준화 플랫폼 API는 JWT(JSON Web Token) 기반 인증을 사용합니다. 모든 데이터 수정 작업(생성, 수정, 삭제)에는 관리자 권한이 필요합니다.

## 인증 프로세스

### 1. 관리자 로그인

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

**성공 응답 (200)**:
```json
{
  "success": true,
  "user": {
    "id": "1",
    "name": "관리자",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**실패 응답 (401)**:
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### 2. JWT 토큰 사용

로그인 성공 시 응답 헤더에 `Set-Cookie`로 JWT 토큰이 설정됩니다. 이후 API 요청시 다음 두 가지 방법 중 하나를 사용할 수 있습니다:

#### 방법 1: Authorization 헤더 (권장)
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 방법 2: 쿠키 (자동)
브라우저 환경에서는 쿠키가 자동으로 전송됩니다.

## 실용적인 예시

### Node.js 예시

```javascript
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  async login(username, password) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // Set-Cookie 헤더에서 토큰 추출
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const tokenMatch = setCookie.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        this.token = tokenMatch[1];
      }
    }

    return data.user;
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    if (!this.token) {
      throw new Error('Not authenticated. Please login first.');
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    });
  }
}

// 사용 예시
const client = new ApiClient('https://your-domain.com');
await client.login('admin', 'password');

// 이제 인증된 요청을 할 수 있습니다
const response = await client.makeAuthenticatedRequest('/api/reports', {
  method: 'POST',
  body: JSON.stringify(reportData)
});
```

### Python 예시

```python
import requests
import json

class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None

    def login(self, username, password):
        response = self.session.post(
            f"{self.base_url}/api/auth/login",
            json={"username": username, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # 쿠키에서 토큰 추출
            auth_token = response.cookies.get('auth-token')
            if auth_token:
                self.token = auth_token
                # 세션에 Authorization 헤더 설정
                self.session.headers.update({
                    'Authorization': f'Bearer {self.token}'
                })
            
            return data['user']
        else:
            raise Exception(f"Login failed: {response.text}")

    def create_report(self, report_data):
        if not self.token:
            raise Exception("Not authenticated. Please login first.")
        
        response = self.session.post(
            f"{self.base_url}/api/reports",
            json=report_data
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to create report: {response.text}")

# 사용 예시
client = ApiClient('https://your-domain.com')
user = client.login('admin', 'password')
print(f"Logged in as: {user['name']}")

# 이제 인증된 요청을 할 수 있습니다
result = client.create_report({
    "title": "새 보고서",
    "date": "2024-08-24",
    "summary": "보고서 요약",
    "content": "보고서 내용",
    "category": "표준",
    "organization": "ITU",
    "tags": ["메타버스", "표준화"]
})
```

### curl 예시

```bash
# 1. 로그인하여 토큰 획득
curl -c cookies.txt -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# 2. 쿠키를 사용하여 인증된 요청
curl -b cookies.txt -X POST https://your-domain.com/api/reports \
  -H "Content-Type: application/json" \
  -d @report-data.json

# 또는 Authorization 헤더 사용 (토큰을 수동으로 추출한 경우)
curl -X POST https://your-domain.com/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @report-data.json
```

## 토큰 관리

### 토큰 유효성 확인

```http
GET /api/auth/session
Authorization: Bearer YOUR_JWT_TOKEN
```

**유효한 토큰 (200)**:
```json
{
  "user": {
    "id": "1",
    "name": "관리자",
    "email": "admin@example.com", 
    "role": "admin"
  },
  "expires": "2024-08-31T12:00:00.000Z"
}
```

**무효한 토큰 (401)**:
```json
{
  "error": "Invalid or expired token"
}
```

### 토큰 만료 및 갱신

- JWT 토큰은 **7일간** 유효합니다
- 토큰이 만료되면 다시 로그인해야 합니다
- 자동 갱신 기능은 제공되지 않습니다

### 로그아웃

```http
POST /api/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

로그아웃은 클라이언트 측에서 토큰을 삭제하는 것으로 충분합니다.

## 보안 고려사항

1. **토큰 저장**: 토큰을 안전한 곳에 저장하고, 만료 후 즉시 삭제하세요
2. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS를 사용하세요
3. **토큰 공유 금지**: 토큰을 다른 사용자와 공유하지 마세요
4. **로그 보안**: 토큰이 로그에 기록되지 않도록 주의하세요

## 에러 처리

### 일반적인 인증 에러

| 상태 코드 | 설명 | 대응 방안 |
|-----------|------|-----------|
| 401 | 인증 실패 | 로그인 정보 확인 후 재시도 |
| 401 | 토큰 만료 | 재로그인 필요 |
| 403 | 권한 부족 | 관리자 권한 확인 |

### 재시도 로직 예시

```javascript
async function makeAuthenticatedRequest(client, endpoint, options, maxRetries = 1) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.makeAuthenticatedRequest(endpoint, options);
      
      if (response.status === 401 && attempt < maxRetries) {
        // 토큰이 만료된 경우 재로그인 시도
        console.log('Token expired, attempting re-login...');
        await client.login(username, password);
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
}
```