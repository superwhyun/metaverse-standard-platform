import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/edge-auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// GET environment variables status (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const { env } = getRequestContext();
    
    // Check for required environment variables
    const envStatus = {
      OPENAI_API_KEY: {
        exists: !!env.OPENAI_API_KEY,
        masked: env.OPENAI_API_KEY ? `${env.OPENAI_API_KEY.substring(0, 8)}...` : null,
        required: true,
        description: 'OpenAI API 키 - 기술 소식 자동 카테고리화에 필요'
      },
      MSP: {
        exists: !!env.MSP,
        masked: '(D1 Database)',
        required: true,
        description: 'D1 데이터베이스 바인딩'
      }
    };

    // Calculate overall health
    const requiredEnvs = Object.entries(envStatus).filter(([, config]) => config.required);
    const missingEnvs = requiredEnvs.filter(([, config]) => !config.exists);
    const healthStatus = missingEnvs.length === 0 ? 'healthy' : 'warning';

    return NextResponse.json({
      status: healthStatus,
      missing: missingEnvs.length,
      total: requiredEnvs.length,
      variables: envStatus,
      missingVariables: missingEnvs.map(([name]) => name)
    });
    
  } catch (error) {
    console.error('Failed to check environment variables:', error);
    return NextResponse.json({ message: '환경변수 확인에 실패했습니다.' }, { status: 500 });
  }
}