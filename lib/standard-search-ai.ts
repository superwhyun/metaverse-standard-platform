import type { StandardResult, StandardSearchContext } from '@/types/standard-search';

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

function buildSystemPrompt(contextData: StandardSearchContext) {
  return `당신은 메타버스와 관련 기술 표준 전문가입니다. 

사용자의 요구사항을 분석하여 관련된 국제 표준들을 찾아 추천해주세요.

다음 정보를 참고하세요:
- 최근 보고서: ${JSON.stringify(contextData.reports.slice(0, 10))}
- 최근 회의: ${JSON.stringify(contextData.conferences.slice(0, 10))}

응답은 반드시 다음 JSON 형식으로 해주세요:
[
  {
    "id": "표준 고유 식별자 (예: iso-iec-23005)",
    "title": "표준 제목",
    "organization": "표준화 기구명 (ISO/IEC, IEEE, W3C, ITU-T 등)",
    "description": "표준에 대한 상세 설명 (200자 이상)",
    "relevanceScore": 관련도 점수 (0-100),
    "tags": ["관련", "태그", "목록"],
    "status": "발표됨|권고안|개발중|초안",
    "publishedDate": "2024-MM-DD"
  }
]

주의사항:
1. 실제 존재하는 표준들만 추천하세요
2. relevanceScore는 사용자 요구사항과의 관련도를 정확히 평가하세요
3. 최대 3개의 표준만 추천하세요 (3개를 넘기지 마세요)
4. 각 표준의 설명은 2-3문장, 400자 이내로 간결하게 작성하세요
5. 반드시 JSON 배열만 출력하세요. 설명 문구, 해설, 마크다운 코드펜스 금지`;
}

async function callOpenAI(apiKey: string, prompt: string, maxOutputTokens: number) {
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
  contextData: StandardSearchContext,
  apiKey: string
): Promise<StandardResult[]> {
  try {
    const systemPrompt = buildSystemPrompt(contextData);
    const initialPrompt = `${systemPrompt}\n\n사용자 요구사항: ${query}`;
    const data = await callOpenAI(apiKey, initialPrompt, 2048);
    const wasIncomplete = data?.status === 'incomplete' && data?.incomplete_details?.reason === 'max_output_tokens';

    let results = tryParseArray(extractResponseText(data)) || [];

    if (wasIncomplete || results.length < 3) {
      const existingIds = results.map((result) => result?.id).filter(Boolean);
      const continuationPrompt = `${systemPrompt}\n\n사용자 요구사항: ${query}\n\n이미 확보한 표준 ID: ${existingIds.join(', ') || '(없음)'}\n남은 항목만 작성하세요. 전체 개수는 최대 3개를 넘지 마세요. 반드시 JSON 배열만 출력하세요.`;

      try {
        const continuationData = await callOpenAI(apiKey, continuationPrompt, 1024);
        const moreResults = tryParseArray(extractResponseText(continuationData)) || [];
        const deduped = new Map<string, StandardResult>();

        for (const result of [...results, ...moreResults]) {
          const key = result?.id || JSON.stringify(result);
          if (!deduped.has(key)) {
            deduped.set(key, result);
          }
        }

        results = Array.from(deduped.values()).slice(0, 3);
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
