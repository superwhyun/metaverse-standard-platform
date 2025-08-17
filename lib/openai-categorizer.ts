import OpenAI from 'openai';
import { categoryOperations } from './database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Category {
  id: number;
  name: string;
  description?: string;
}

export async function categorizeContent(title: string, summary: string): Promise<string | null> {
  try {
    // Get all available categories from database
    const categories = categoryOperations.getAll() as Category[];
    
    if (categories.length === 0) {
      console.log('No categories available for classification');
      return null;
    }

    // Prepare category list for AI prompt
    const categoryList = categories.map(cat => 
      `${cat.name}${cat.description ? ` - ${cat.description}` : ''}`
    ).join('\n');

    const prompt = `다음 기술 기사의 제목과 요약을 분석하여 가장 적합한 카테고리를 선택해주세요.

제목: ${title}
요약: ${summary}

사용 가능한 카테고리:
${categoryList}

응답은 반드시 카테고리 이름만 반환해주세요. 만약 어떤 카테고리에도 해당하지 않는다면 'null'을 반환해주세요.

예시: 아바타`;

    console.log('Sending prompt to OpenAI:', prompt.length, 'characters');
    
    const completion = await openai.responses.create({
      model: 'gpt-5-mini',
      input: prompt,
      reasoning: { effort: 'low' },
      max_output_tokens: 256,
    });
    
    console.log('OpenAI response:', completion);
    const response = completion.output_text?.trim();
    
    if (!response) {
      console.error('No response from OpenAI - completion object:', JSON.stringify(completion, null, 2));
      return null;
    }

    if (response.toLowerCase() === 'null') {
      console.log('OpenAI returned "null" - no suitable category found');
      return null;
    }

    // Validate that the returned category name exists
    if (!categories.some(cat => cat.name === response)) {
      console.error(`Invalid category name returned: ${response}`);
      return null;
    }

    return response;
  } catch (error) {
    console.error('Error categorizing content:', error);
    return null;
  }
}