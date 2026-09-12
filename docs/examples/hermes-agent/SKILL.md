---
name: metaverse-standards-report-ingest
description: 헤르메스 에이전트가 메타버스 국제표준화 플랫폼에 표준화 동향 보고서와 회의 일정을 API로 자동 등록할 때 사용하는 스킬. "표준화 동향 등록", "보고서 등록", "회의 일정 등록", "metaverse-standards.kr" 관련 요청에 사용.
---

# 표준화 동향 보고서 / 회의 일정 등록 (Metaverse Standards Platform)

이 스킬은 분석이 끝난 표준화 동향/회의 보고서와 회의 일정을 메타버스 국제표준화 플랫폼(`https://metaverse-standards.kr`)에
API로 자동 등록하는 방법을 설명합니다. 이 플랫폼은 별도의 API 키 방식이 아니라 **관리자 계정 로그인 → JWT 토큰**
방식의 인증을 사용합니다. 전체 API 레퍼런스는 이 저장소의 `docs/README.md`, `docs/api-reference/reports/create.md`,
`docs/api-reference/conferences/create.md`를 참고하세요. 이 문서는 그중 헤르메스가 실제로 써야 하는 흐름만 요약한 것입니다.

## 1. 인증

전용 계정(`hermes-agent`, role: admin)이 이미 프로덕션 DB에 생성되어 있습니다. 사용자명/비밀번호는 이 스킬 파일에
넣지 않습니다 — 헤르메스의 시크릿 저장소에 별도로 전달받은 값을 사용하세요.

```bash
curl -X POST https://metaverse-standards.kr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "hermes-agent", "password": "<전달받은 비밀번호>"}'
```

성공 응답(200)의 `Set-Cookie: auth-token=...` 값을 추출해 이후 요청에 다음 헤더로 사용합니다.

```
Authorization: Bearer <auth-token 값>
```

- 토큰은 **7일간 유효**합니다. 캐싱해서 재사용하고, `401` 응답을 받으면 재로그인하세요.
- 로그인 실패(401) 시 자격 증명을 다시 확인하세요. 재시도 전에 무한 루프가 되지 않도록 주의하세요.

## 2. 보고서 등록

```bash
curl -X POST https://metaverse-standards.kr/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <auth-token 값>" \
  -d '{
    "title": "ITU-T SG16 - #45차",
    "date": "2026-08-23",
    "summary": "주요 표준화 논의내용 (1000자 이내)",
    "content": "## 개요\n마크다운 형식의 본문 전체 내용",
    "category": "표준화 협력",
    "organization": "ITU-T",
    "tags": ["메타버스", "표준화"],
    "downloadUrl": "https://example.com/report.pdf",
    "conferenceId": null
  }'
```

### 필드

| 필드 | 필수 | 설명 |
|---|---|---|
| `title` | ✅ | 보고서 제목. `"그룹명 - #[차수]"` 형식 (예: `"JTC 1/SC 24 - #15차"`) |
| `date` | ✅ | `YYYY-MM-DD`. 원본 자료 파일명에서 우선 추론, 없으면 본문에서 추론 |
| `summary` | 권장 | 주요 표준화 논의내용을 1000자 이내 문장으로 작성 |
| `content` | 권장 | 마크다운 본문 |
| `category` | 권장 | 자유 텍스트 (기존 카테고리와 표기를 맞추는 걸 권장) |
| `organization` | 권장 | 자유 텍스트 (예: ITU-T, ISO, IEEE) |
| `tags` | 선택 | 문자열 배열 |
| `downloadUrl` | 선택 | 원본 PDF 등 링크 |
| `conferenceId` | 선택 | 연관된 회의 ID. 모르면 생략하거나 `null` |

`category`/`organization`은 DB에 자유 텍스트로 저장됩니다(고정 목록 강제 없음). 다만 기존 표기와 다르게 쓰면
플랫폼의 조직/카테고리별 필터에서 별도 항목으로 갈라지니, 가능하면 `GET /api/organizations`, `GET /api/categories`로
기존 값을 확인한 뒤 맞춰 쓰세요.

### 응답

성공(200):
```json
{ "success": true, "data": { "id": 110, "title": "...", ... } }
```

실패:
- `401` — 인증 실패/만료 → 재로그인
- `500` — 서버 오류 → 그대로 재시도하지 말고 잠시 후 재시도 (`error` 필드에 사유)

## 3. 회의 일정 등록

동일한 인증(1번 항목의 JWT)으로 회의 일정도 등록할 수 있습니다. 별도 계정/권한 설정이 필요 없습니다 — `hermes-agent`
계정이 이미 admin이라 바로 호출 가능합니다.

```bash
curl -X POST https://metaverse-standards.kr/api/conferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <auth-token 값>" \
  -d '{
    "title": "ITU-T SG16 Q4 메타버스 표준화 회의",
    "organization": "ITU-T",
    "location": "제네바, 스위스",
    "description": "메타버스 표준화 관련 분기별 정기 회의",
    "startDate": "2026-09-15",
    "endDate": "2026-09-17",
    "startTime": "09:00",
    "endTime": "17:00"
  }'
```

### 필드

| 필드 | 필수 | 설명 |
|---|---|---|
| `title` | ✅ | 회의 제목 |
| `organization` | ✅ | 주관 기관 (자유 텍스트, 2번 항목과 동일하게 기존 값과 맞출 것) |
| `startDate` | ✅ | 시작 날짜 (`YYYY-MM-DD`) |
| `endDate` | ✅ | 종료 날짜 (`YYYY-MM-DD`) |
| `location` | 선택 | 회의 장소 |
| `description` | 선택 | 회의 설명 |
| `startTime`/`endTime` | 선택 | `HH:MM`. `startDate` ≠ `endDate`(다일간 회의)면 무시됨 |

### 응답

성공(201):
```json
{ "success": true, "data": { "id": 124, "title": "...", "isMultiDay": true, ... } }
```

실패:
- `400` — 필수 필드(`title`/`organization`/`startDate`/`endDate`) 누락
- `401` — 인증 실패/만료 → 재로그인

### 보고서와 연결하기

회의를 먼저 등록해 그 응답의 `data.id`를 받아두면, 이후 2번 항목(보고서 등록) 호출 시 `conferenceId`에
그 값을 넣어 회의-보고서를 연결할 수 있습니다. 회의와 무관한 단독 보고서라면 `conferenceId`는 생략하거나 `null`.

## 4. 내용 작성 기준 (`summary` / `content`)

API 스펙은 필드의 "형식"만 정의합니다. 실제 "무엇을 어떻게 써야 하는지"는 이 플랫폼이 관리자 화면에서 회의록을
분석할 때 쓰는 지침(`components/admin-report-form.tsx`의 프롬프트, 본문 스타일은 `config/vtt-prompt.ts`)을
그대로 따르세요. 기존에 등록된 보고서들과 형식·문체·구조가 어긋나지 않게 하기 위함입니다.

**공통 (title/date/summary/content 전부에 적용)**
- 역할: 전문 회의록 작성자로서 작성.
- `title`: `"그룹명 - #[차수]"` 형식. 예: `"JTC 1/SC 24 - #15차"`.
- `date`: `YYYY-MM-DD`. 원본 자료의 파일명에서 먼저 추론하고, 없으면 본문에서 추론.
- `summary`: 주요 표준화 논의내용을 **1000자 이내** 문장으로 작성.

**`content` 작성 세부 규칙**
- **문체**: 경어체/구어체 금지. 공식 문서체, 개조식(명사형 종결)으로 작성.
- **분량**: 한글 1500자 이내.
- **구조**: 아래 4개 섹션을 마크다운 헤더(`##`)로 구성 (섹션명은 내용에 맞게 조정 가능, 형식만 참고):
  - `## 핵심 논의`
  - `## 기술·응용 논점`
  - `## 향후 표준화 연계`
  - `## 시사점`
  - 각 항목은 150자 이상의 완결된 문장으로 서술.
- **제외할 내용**: 참석자 소개, 회의 진행 규칙/주의사항, 프롬프트 자체에 대한 설명은 절대 포함하지 말 것.
- **익명화**: 기업명·개인명·참석자명 등 외부 공개 시 문제가 될 수 있는 정보는 노출하지 말 것. 이 보고서는
  공개 플랫폼에 그대로 게시됩니다.

`category`/`organization`은 DB에 자유 텍스트로 저장되지만(고정 목록 강제 없음), 표기가 갈리면 플랫폼의
필터에서 별도 항목으로 쪼개집니다. 새 값을 쓰기 전에 반드시 아래로 기존 값을 먼저 확인하고 맞추세요.

```bash
curl -s https://metaverse-standards.kr/api/categories   # name, description 목록
curl -s https://metaverse-standards.kr/api/organizations # name 목록 (예: ITU-T, ISO, IEEE, MSF, W3C ...)
```

## 5. 참고

- 전체 API 레퍼런스: `docs/README.md`, `docs/api-reference/reports/create.md`, `docs/api-reference/conferences/create.md`, `docs/authentication.md`
- 내용 작성 지침 원본: `components/admin-report-form.tsx` (usageInstructions), `config/vtt-prompt.ts` (본문 스타일)
- Node.js 예시 코드: `docs/examples/bulk-import/node-example/`
- 요청 사이에 적절한 지연을 두세요 (Rate limiting 안내는 `docs/README.md` 참고).
