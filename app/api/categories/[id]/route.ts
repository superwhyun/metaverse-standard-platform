import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createCategoryOperations } from '@/lib/database-operations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: NextRequest, { params, env }: { params: { id: string }, env: any }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = await createDatabaseAdapter(env);
    const categoryOperations = createCategoryOperations(db);
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const { name, description } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ message: '카테고리 이름이 필요합니다.' }, { status: 400 });
    }

    const existingCategory = await categoryOperations.getById(id);
    if (!existingCategory) {
      return NextResponse.json({ message: '해당 카테고리를 찾을 수 없습니다.' }, { status: 404 });
    }

    const updatedCategory = await categoryOperations.update(id, {
      name: name.trim(),
      description: description?.trim() || null
    });
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error(`Failed to update category:`, error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ message: '이미 존재하는 카테고리 이름입니다.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params, env }: { params: { id: string }, env: any }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = await createDatabaseAdapter(env);
    const categoryOperations = createCategoryOperations(db);
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const success = await categoryOperations.delete(id);

    if (success) {
      return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Category not found or could not be deleted' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to delete category:`, error);
    return NextResponse.json({ message: 'Failed to delete category' }, { status: 500 });
  }
}