import type { StandardResult } from '@/types/standard-search';

const STANDARD_SEARCH_MODEL = 'gpt-5-nano';

function extractResponseText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data?.output)) {
    return '';
  }

  for (const item of data.output) {
    if (item?.type === 'message' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (typeof part?.text === 'string' && part.text.trim()) {
          return part.text.trim();
        }
      }
    }

    if (typeof item?.text === 'string' && item.text.trim()) {
      return item.text.trim();
    }
  }

  return '';
}

function tryParseArray(text: string): StandardResult[] | null {
  try {
    let jsonText = text;
    const fenceMatch = text.match(/```(?:json)?\n([\s\S]*?)```/i);
    if (fenceMatch) {
      jsonText = fenceMatch[1];
    }

    const firstBracket = jsonText.indexOf('[');
    const lastBracket = jsonText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonText = jsonText.slice(firstBracket, lastBracket + 1);
    }

    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    const recovered: StandardResult[] = [];
    const matches = text.match(/\{[\s\S]*?\}/g);
    if (!matches) {
      return null;
    }

    for (const match of matches) {
      try {
        recovered.push(JSON.parse(match));
      } catch (_) {
        // skip invalid partial objects
      }
    }

    return recovered.length > 0 ? recovered : null;
  }
}

function buildSystemPrompt() {
  return `당신은 메타버스와 관련 기술 표준 전문가입니다.

연결된 파일 검색 도구(file_search)를 사용해서, 사용자의 요구사항과 관련된 실제 표준을
찾아 추천해주세요. 파일 검색으로 찾은 실제 데이터에 근거해서만 답변하고, 검색 결과에 없는
표준을 지어내지 마세요.

각 파일은 표준 1개에 대한 "필드명: 값" 형식의 레코드입니다. 파일마다 필드 구성이 다를 수
있으니(표준번호, 표준명, 표준기구, 설명 등 시트에 따라 컬럼이 다름), 실제로 존재하는 필드를
보고 아래 JSON 형식에 최대한 맞게 매핑하세요.

응답은 반드시 다음 JSON 형식으로 해주세요:
[
  {
    "id": "표준 고유 식별자 (표준번호 등, 없으면 제목 기반으로 생성)",
    "title": "표준 제목/표준명",
    "organization": "표준화 기구명",
    "description": "표준 문서에 실제로 명시된 내용에만 근거해 사용자 요구사항과 구체적으로 어떻게 연결되는지 서술 (해당 파일의 설명 필드를 기반으로, 없으면 다른 필드를 조합). 일부만 관련되거나 간접적으로만 연관된 경우 그 한계를 명확히 밝히고, 억지로 관련 있는 것처럼 포장하지 마세요.",
    "relevanceScore": 관련도 점수 (0-100),
    "tags": ["관련", "키워드", "목록"],
    "status": "파일에 상태 관련 필드가 있으면 그 값, 없으면 \"정보 없음\"",
    "publishedDate": "파일에 날짜 필드가 있으면 그 값, 없으면 빈 문자열"
  }
]

주의사항:
1. file_search로 실제 검색된 표준만 추천하세요. 검색 결과가 없으면 빈 배열을 반환하세요.
2. relevanceScore는 중립적이고 보수적으로 평가하세요. 표준 문서에 실제로 명시된 내용과
   사용자 요구사항이 얼마나 정확히 일치하는지만 기준으로 삼고, 후하게 주거나 유사성을
   과장하지 마세요. 키워드만 겹치고 실질적 내용이 다르면 낮은 점수(30~50)를, 요구사항을
   직접적으로 다루는 경우에만 높은 점수(80 이상)를 주세요.
3. 관련성을 부풀리거나 억지로 끼워맞추지 마세요. 진짜로 관련 있는 표준이 몇 개 없다면
   그만큼만 반환하세요 — 개수를 채우기 위해 관련 없는 표준을 포함하지 마세요.
4. 최대 8개의 표준만 추천하세요 (8개를 넘기지 마세요).
5. 각 표준의 설명은 2-3문장, 400자 이내로 간결하게 작성하세요.
6. 반드시 JSON 배열만 출력하세요. 설명 문구, 해설, 마크다운 코드펜스 금지`;
}

async function callOpenAI(apiKey: string, prompt: string, vectorStoreId: string, maxOutputTokens: number) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: STANDARD_SEARCH_MODEL,
      reasoning: { effort: 'low' },
      input: [{ role: 'user', content: prompt }],
      tools: [{ type: 'file_search', vector_store_ids: [vectorStoreId] }],
      max_output_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

export async function performAISearch(
  query: string,
  vectorStoreId: string,
  apiKey: string
): Promise<StandardResult[]> {
  try {
    const systemPrompt = buildSystemPrompt();
    const initialPrompt = `${systemPrompt}\n\n사용자 요구사항: ${query}`;
    const data = await callOpenAI(apiKey, initialPrompt, vectorStoreId, 4096);
    const wasIncomplete = data?.status === 'incomplete' && data?.incomplete_details?.reason === 'max_output_tokens';

    let results = tryParseArray(extractResponseText(data)) || [];

    // 개수가 8개 미만인 것 자체는 이어쓰기 사유가 아님(관련성을 부풀려 억지로 채우는 것을 방지) —
    // 출력이 실제로 잘렸을 때(max_output_tokens)만 이어서 요청한다.
    if (wasIncomplete) {
      const existingIds = results.map((result) => result?.id).filter(Boolean);
      const continuationPrompt = `${systemPrompt}\n\n사용자 요구사항: ${query}\n\n이미 확보한 표준 ID: ${existingIds.join(', ') || '(없음)'}\n출력이 잘렸습니다. 이미 나열한 항목과 겹치지 않는 나머지 항목만 이어서 작성하세요. 전체 개수는 최대 8개를 넘지 마세요. 개수를 채우기 위해 관련성이 낮은 표준을 억지로 포함하지 마세요. 반드시 JSON 배열만 출력하세요.`;

      try {
        const continuationData = await callOpenAI(apiKey, continuationPrompt, vectorStoreId, 2048);
        const moreResults = tryParseArray(extractResponseText(continuationData)) || [];
        const deduped = new Map<string, StandardResult>();

        for (const result of [...results, ...moreResults]) {
          const key = result?.id || JSON.stringify(result);
          if (!deduped.has(key)) {
            deduped.set(key, result);
          }
        }

        results = Array.from(deduped.values()).slice(0, 8);
      } catch (error) {
        console.warn('Standard search continuation failed:', error);
      }
    }

    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('AI search failed:', error);
    return [];
  }
}
