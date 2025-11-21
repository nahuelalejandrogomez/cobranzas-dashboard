import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return Response.json(
        { error: 'No session' },
        { status: 401 }
      );
    }

    const session = getSession(token);
    
    if (!session) {
      return Response.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    return Response.json(session);
  } catch (error) {
    console.error('Check auth error:', error);
    return Response.json(
      { error: 'Failed to check auth' },
      { status: 500 }
    );
  }
}
