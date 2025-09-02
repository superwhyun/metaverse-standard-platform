import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createWordcloudStopwordsOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const stopwordsOperations = createWordcloudStopwordsOperations(db);
    
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') as 'korean' | 'english' | null;

    if (language && (language === 'korean' || language === 'english')) {
      // Get words for specific language
      const result = await stopwordsOperations.getByLanguage(language);
      const wordsArray = result?.words 
        ? (result.words as string).split(',').map(word => word.trim()).filter(word => word.length > 0)
        : [];
      
      return NextResponse.json({
        success: true,
        data: {
          language,
          words: wordsArray,
          wordsString: result?.words || '',
          updatedAt: result?.updated_at
        }
      });
    } else {
      // Get all languages
      const allStopwords = await stopwordsOperations.getAll();
      const formattedData = allStopwords.reduce((acc: any, item: any) => {
        const wordsArray = item.words 
          ? (item.words as string).split(',').map((word: string) => word.trim()).filter((word: string) => word.length > 0)
          : [];
        
        acc[item.language] = {
          words: wordsArray,
          wordsString: item.words || '',
          updatedAt: item.updated_at
        };
        return acc;
      }, {});

      return NextResponse.json({
        success: true,
        data: formattedData
      });
    }
  } catch (error) {
    console.error('Failed to get wordcloud stopwords:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get stopwords' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const stopwordsOperations = createWordcloudStopwordsOperations(db);
    
    const body = await request.json();
    const { language, words } = body;

    // Validate input
    if (!language || (language !== 'korean' && language !== 'english')) {
      return NextResponse.json(
        { success: false, error: 'Invalid language. Must be "korean" or "english"' },
        { status: 400 }
      );
    }

    if (typeof words !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Words must be a string' },
        { status: 400 }
      );
    }

    // Clean and validate words
    const cleanedWords = words
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .join(',');

    // Update in database
    const success = await stopwordsOperations.updateWords(language, cleanedWords);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `${language === 'korean' ? '한글' : '영어'} 배제어 목록이 업데이트되었습니다.`,
        data: {
          language,
          words: cleanedWords.split(','),
          wordsString: cleanedWords
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update stopwords' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to update wordcloud stopwords:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stopwords' },
      { status: 500 }
    );
  }
}