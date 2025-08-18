import { getSessionFromRequest } from '../../../lib/edge-auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const session = await getSessionFromRequest(request, env.NEXTAUTH_SECRET);
    
    return new Response(JSON.stringify({ 
      session 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return new Response(JSON.stringify({ 
      session: null 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}