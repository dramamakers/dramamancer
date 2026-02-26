import { NextResponse } from 'next/server';
import { getLocalUserForAuth } from '../utils';

export const runtime = 'nodejs'; // Force Node.js runtime instead of Edge

/**
 * Public version: always return the local user. No session required; user is never "logged out".
 */
export async function GET() {
  try {
    const user = await getLocalUserForAuth('');
    if (!user) {
      return NextResponse.json({ error: 'User unavailable' }, { status: 500 });
    }

    const response = NextResponse.json({ user });
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    return response;
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
