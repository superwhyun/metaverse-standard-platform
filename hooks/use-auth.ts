// Edge Runtime 호환 클라이언트 인증 훅
'use client';

import { useState, useEffect, useCallback } from 'react';

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

export interface AuthState {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

export function useAuth(): AuthState & {
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    status: 'loading'
  });

  // 세션 확인
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      
      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          setAuthState({
            session: data.session,
            status: 'authenticated'
          });
        } else {
          setAuthState({
            session: null,
            status: 'unauthenticated'
          });
        }
      } else {
        setAuthState({
          session: null,
          status: 'unauthenticated'
        });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setAuthState({
        session: null,
        status: 'unauthenticated'
      });
    }
  }, []);

  // 로그인
  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await checkSession(); // 세션 새로고침
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error' 
      };
    }
  }, [checkSession]);

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        session: null,
        status: 'unauthenticated'
      });
    }
  }, []);

  // 세션 새로고침
  const refresh = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  // 컴포넌트 마운트 시 세션 확인
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return {
    ...authState,
    signIn,
    signOut,
    refresh
  };
}