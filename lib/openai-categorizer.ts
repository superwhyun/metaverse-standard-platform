import OpenAI from 'openai';
import { createDatabaseAdapter } from './database-adapter';
import { createCategoryOperations } from './database-operations';
import { getRequestContext } from '@cloudflare/next-on-pages';

// OpenAI 클라이언트는 런타임에 생성
function getOpenAIClient() {
  const { env } = getRequestContext();
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey });
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

export async function categorizeContent(title: string, summary: string): Promise<string | null> {
  try {
    const db = await createDatabaseAdapter();
    const categoryOperations = createCategoryOperations(db);
    const categories = await categoryOperations.getAll() as Category[];
    
    if (categories.length === 0) {
      console.log('No categories available for classification');
      return null;
    }

    const categoryList = categories.map(cat => cat.name).join(',');

    const prompt = `다음 기술 기사를 분석하여 가장 적합한 카테고리 하나를 선택하세요.

기사 제목: ${title}
기사 요약: ${summary}

선택 가능한 카테고리:
${categoryList}

지침:
- 위 카테고리 목록에서 정확한 카테고리 이름 하나만 반환하세요
- 어떤 카테고리에도 해당하지 않으면 '기타'를 반환하세요
- 카테고리 이름 외에는 아무것도 쓰지 마세요

예시:
- 좋은 응답: "아바타"
- 좋은 응답: "기타"
- 나쁜 응답: "아바타 카테고리가 적합합니다"`;

    console.log('=== OpenAI 프롬프트 전체 내용 ===');
    console.log(prompt);
    console.log('=== 프롬프트 끝 ===');
    console.log('Sending prompt to OpenAI:', prompt.length, 'characters');
    
    const openai = getOpenAIClient();
    
    const requestParams = {
      model: 'gpt-5-nano',
      reasoning: { effort: 'low' as const },
      input: prompt,
      max_output_tokens: 512,
    };
    
    console.log('=== OpenAI 요청 파라미터 ===');
    console.log('Model:', requestParams.model);
    console.log('Max output tokens:', requestParams.max_output_tokens);
    console.log('Reasoning effort:', requestParams.reasoning.effort);
    console.log('Request timestamp:', new Date().toISOString());
    
    const startTime = Date.now();
    const completion = await openai.responses.create(requestParams);
    const endTime = Date.now();
    
    console.log('=== OpenAI 응답 정보 ===');
    console.log('Response time:', endTime - startTime, 'ms');
    console.log('Response timestamp:', new Date().toISOString());
    console.log('Usage:', completion.usage);
    console.log('Full OpenAI response object:', JSON.stringify(completion, null, 2));
    const response = completion.output_text?.trim();
    
    if (!response) {
      console.error('No response from OpenAI - completion object:', JSON.stringify(completion, null, 2));
      return null;
    }

    // 따옴표 제거 및 정리
    const cleanedResponse = response.replace(/^["']|["']$/g, '').trim();
    console.log('=== OpenAI 응답 처리 ===');
    console.log('원본 응답:', `"${response}"`);
    console.log('정리된 응답:', `"${cleanedResponse}"`);

    if (cleanedResponse.toLowerCase() === 'null' || cleanedResponse === '기타') {
      console.log(`OpenAI returned "${cleanedResponse}" - using default category "기타"`);
      return '기타';
    }

    console.log('=== 카테고리 매칭 과정 ===');
    console.log('사용 가능한 카테고리:', categories.map(cat => cat.name).join(', '));
    
    // 정확한 매칭 확인
    console.log('1단계: 정확한 매칭 확인 중...');
    const exactMatch = categories.find(cat => cat.name === cleanedResponse);
    if (exactMatch) {
      console.log(`✓ 정확한 매칭 발견: "${cleanedResponse}"`);
      return cleanedResponse;
    }
    console.log('✗ 정확한 매칭 없음');

    // 부분 매칭 확인 (대소문자 무시)
    console.log('2단계: 부분 매칭 확인 중...');
    const partialMatch = categories.find(cat => 
      cat.name.toLowerCase().includes(cleanedResponse.toLowerCase()) || 
      cleanedResponse.toLowerCase().includes(cat.name.toLowerCase())
    );
    
    if (partialMatch) {
      console.log(`✓ 부분 매칭 발견: "${cleanedResponse}" -> "${partialMatch.name}"`);
      return partialMatch.name;
    }
    console.log('✗ 부분 매칭 없음');

    // 카테고리 목록에서 가장 유사한 카테고리 찾기 (간단한 키워드 매칭)
    console.log('3단계: 키워드 매칭 확인 중...');
    const keywordMatch = categories.find(cat => {
      const catKeywords = cat.name.split(' ');
      const responseKeywords = cleanedResponse.split(' ');
      const hasMatch = catKeywords.some(keyword => 
        responseKeywords.some(respKeyword => 
          keyword.toLowerCase().includes(respKeyword.toLowerCase()) ||
          respKeyword.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      console.log(`키워드 매칭 테스트: "${cat.name}" vs "${cleanedResponse}" = ${hasMatch}`);
      return hasMatch;
    });

    if (keywordMatch) {
      console.log(`✓ 키워드 매칭 발견: "${cleanedResponse}" -> "${keywordMatch.name}"`);
      return keywordMatch.name;
    }
    console.log('✗ 키워드 매칭 없음');

    console.log('=== 매칭 실패: 기본 카테고리 사용 ===');
    console.log(`No valid category match found for: "${cleanedResponse}"`);
    console.log('Using default category "기타"');
    return '기타';
  } catch (error) {
    console.error('Error categorizing content:', error);
    console.log('Using default category "기타" due to error');
    return '기타';
  }
}
