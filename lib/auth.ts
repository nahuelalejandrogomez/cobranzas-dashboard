import crypto from 'crypto';

// Simple in-memory session storage (in production, use a database or session store like Redis)
const sessions = new Map<string, { username: string; createdAt: number }>();

const VALID_USERS = [
  { username: 'admin', password: 'admin123' },
  { username: 'cobranzas', password: 'cobranzas123' },
];

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCredentials(
  username: string,
  password: string
): boolean {
  return VALID_USERS.some(
    (user) => user.username === username && user.password === password
  );
}

export function createSession(username: string): string {
  const token = generateSessionToken();
  sessions.set(token, { username, createdAt: Date.now() });
  return token;
}

export function getSession(token: string): { username: string } | null {
  const session = sessions.get(token);
  if (!session) return null;

  // Session expires after 24 hours
  const EXPIRY = 24 * 60 * 60 * 1000;
  if (Date.now() - session.createdAt > EXPIRY) {
    sessions.delete(token);
    return null;
  }

  return { username: session.username };
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}
