import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createStandardRecommendSettingsOperations, createAdminApiSettingsOperations } from '@/lib/database-operations';
import { performAISearch } from '@/lib/standard-search-ai';
import { getEnv } from '@/lib/env';

export const runtime = 'edge';

// 표준 카탈로그 벡터스토어 ID 조회 (구글시트 동기화 결과)
async function getVectorStoreId(): Promise<string | null> {
  try {
    const db = await createDatabaseAdapter();
    const settingsOperations = createStandardRecommendSettingsOperations(db);
    const settings = await settingsOperations.get();
    return (settings?.vector_store_id as string | null) || null;
  } catch (error) {
    console.error('Failed to load standard-recommend vector store id:', error);
    return null;
  }
}

// OpenAI API 키 조회: 관리자 설정(API 설정) > API 설정에서 저장한 값을 우선 사용,
// 없으면 Cloudflare 환경변수로 폴백
async function getOpenAIApiKey(): Promise<string | undefined> {
  try {
    const db = await createDatabaseAdapter();
    const settingsOperations = createAdminApiSettingsOperations(db);
    const settings = await settingsOperations.get();
    const key = (settings?.openai_api_key as string | null) || null;
    if (key) return key;
  } catch (error) {
    console.error('Failed to load admin api settings openai key:', error);
  }
  return getEnv('OPENAI_API_KEY');
}

// POST AI 표준 검색 (동기 처리: OpenAI 응답을 기다렸다가 결과를 그대로 반환)
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ message: 'Query is required' }, { status: 400 });
    }

    const normalizedQuery = query.trim();

    const vectorStoreId = await getVectorStoreId();
    if (!vectorStoreId) {
      return NextResponse.json({
        message: '먼저 관리자가 표준 목록을 동기화해야 합니다. (관리자 > 시스템 > 표준 추천 설정)'
      }, { status: 400 });
    }

    const OPENAI_API_KEY = await getOpenAIApiKey();
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not available');
      return NextResponse.json({
        message: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.'
      }, { status: 500 });
    }

    const searchResults = await performAISearch(normalizedQuery, vectorStoreId, OPENAI_API_KEY);

    return NextResponse.json({
      status: 'completed',
      results: searchResults,
      message: `${searchResults.length}개의 관련 표준을 찾았습니다.`
    }, { status: 200 });
  } catch (error) {
    console.error('standard-search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({
      message: `처리 중 오류 발생: ${errorMessage}`
    }, { status: 500 });
  }
}
