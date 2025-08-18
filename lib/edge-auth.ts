// Edge Runtime 호환 인증 시스템
import { SignJWT, jwtVerify } from 'jose';

// JWT secret will be passed as parameter in Cloudflare Functions
let cachedSecret: Uint8Array | null = null;

function getSecret(envSecret?: string): Uint8Array {
  if (cachedSecret) return cachedSecret;
  
  const JWT_SECRET = envSecret || 'default-secret-change-in-production';
  cachedSecret = new TextEncoder().encode(JWT_SECRET);
  return cachedSecret;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Session {
  user: User;
  expires: string;
}

// JWT 토큰 생성
export async function createToken(user: User, envSecret?: string): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7일 만료
    .sign(getSecret(envSecret));
  
  return token;
}

// JWT 토큰 검증
export async function verifyToken(token: string, envSecret?: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(envSecret));
    return payload.user as User;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}


// 요청에서 세션 가져오기 (Edge Runtime 호환)
export async function getSessionFromRequest(request: Request, envSecret?: string): Promise<Session | null> {
  try {
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    // Authorization header에서 토큰 추출
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Cookie에서 토큰 추출 (fallback)
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        token = cookies['auth-token'];
      }
    }

    if (!token) {
      return null;
    }

    const user = await verifyToken(token, envSecret);
    if (!user) {
      return null;
    }

    return {
      user,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일 후
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

// 세션 쿠키 생성
export function createSessionCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7일 (초)
  return `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
}

// 세션 쿠키 삭제
export function clearSessionCookie(): string {
  return `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`;
}