import { createDatabaseAdapter } from '../../../lib/database-adapter.js';
import { createToken } from '../../../lib/edge-auth.js';
import bcrypt from 'bcryptjs';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Username and password are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await createDatabaseAdapter(env);
    const userQuery = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = await userQuery.get(username);

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid credentials' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid credentials' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userObj = {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = await createToken(userObj, env.NEXTAUTH_SECRET);

    const response = new Response(JSON.stringify({ 
      success: true, 
      user: userObj 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    response.headers.set('Set-Cookie', `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`);
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}