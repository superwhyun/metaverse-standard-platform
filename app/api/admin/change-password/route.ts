import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { getSessionFromRequest } from '@/lib/edge-auth';
import { verifyPassword, hashPassword } from '@/lib/crypto-utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '현재 비밀번호와 새 비밀번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 새 비밀번호 유효성 검증
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: '새 비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const db = await createDatabaseAdapter();
    
    // 현재 사용자 정보 조회
    const userQuery = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = await userQuery.get(session.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 현재 비밀번호 검증
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 새 비밀번호 해싱 및 업데이트
    const hashedNewPassword = await hashPassword(newPassword);
    const updateQuery = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    await updateQuery.run([hashedNewPassword, session.user.id]);

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('비밀번호 변경 중 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}