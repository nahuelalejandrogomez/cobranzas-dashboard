import { validateCredentials, createSession } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session-utils';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { error: 'Usuario y contraseña requeridos' },
        { status: 400 }
      );
    }

    if (!validateCredentials(username, password)) {
      return Response.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const token = createSession(username);
    
    // Create response with cookie
    const response = Response.json({ success: true, username });
    
    // Set cookie directly in response
    response.headers.set(
      'Set-Cookie',
      `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
