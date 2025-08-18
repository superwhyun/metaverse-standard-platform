import { createDatabaseAdapter } from '../../lib/database-adapter.js';
import { createConferenceOperations } from '../../lib/database-operations.js';
import { getSessionFromRequest } from '../../lib/edge-auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const db = await createDatabaseAdapter(env);
    const conferenceOperations = createConferenceOperations(db);
    
    const conferences = await conferenceOperations.getAll();
    return new Response(JSON.stringify({ success: true, data: conferences }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to get conferences:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to get conferences' }), {
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
    const conferenceOperations = createConferenceOperations(db);
    const data = await request.json();
    
    const result = await conferenceOperations.create(data);
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to create conference:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create conference' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}