import { clearSessionCookie } from '@/lib/session-utils';

export async function POST() {
  try {
    await clearSessionCookie();
    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
