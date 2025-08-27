import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createToken, createSessionCookie } from '@/lib/edge-auth';
import { verifyPassword } from '@/lib/crypto-utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // D1 데이터베이스에서 사용자 조회 (next-on-pages 환경)
    const db = await createDatabaseAdapter();
    const userQuery = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = await userQuery.get(username);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Login attempt for username:', username);
      console.log('User found in DB:', !!user);
      if (user) {
        console.log('User ID:', user.id, 'Role:', user.role);
      }
    }

    if (!user) {
      console.log('User not found in database');
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    if (process.env.NODE_ENV !== 'production') console.log('Verifying password...');
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (process.env.NODE_ENV !== 'production') console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      if (process.env.NODE_ENV !== 'production') console.log('Password verification failed');
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const userObj = {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = await createToken(userObj);
    
    const response = NextResponse.json({
      success: true,
      user: userObj
    });

    // 쿠키에 토큰 설정
    response.headers.set('Set-Cookie', createSessionCookie(token));

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
