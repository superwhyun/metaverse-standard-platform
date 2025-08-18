import { createDatabaseAdapter } from '../../lib/database-adapter.js';
import { createCategoryOperations } from '../../lib/database-operations.js';
import { getSessionFromRequest } from '../../lib/edge-auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const db = await createDatabaseAdapter(env);
    const categoryOperations = createCategoryOperations(db);
    
    const categories = await categoryOperations.getAll();
    return new Response(JSON.stringify({ success: true, data: categories }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to get categories:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to get categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const session = await getSessionFromRequest(request, env.NEXTAUTH_SECRET);
    if (!session || session.user?.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: '관리자 권한이 필요합니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await createDatabaseAdapter(env);
    const categoryOperations = createCategoryOperations(db);
    const data = await request.json();
    
    const result = await categoryOperations.create(data);
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to create category:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create category' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}