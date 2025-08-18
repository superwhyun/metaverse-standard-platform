import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // 세션 쿠키 삭제
    response.headers.set('Set-Cookie', clearSessionCookie());

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}