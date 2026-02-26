export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getLocalUserForAuth } from '../utils';

/**
 * Public version: always return a token (placeholder). No session required; user is never logged out.
 */
export async function GET() {
  try {
    const user = await getLocalUserForAuth('');
    if (!user) {
      return NextResponse.json({ error: 'User unavailable' }, { status: 500 });
    }
    // Return a stable placeholder token for the local user
    return NextResponse.json({ token: 'local-user' });
  } catch (error) {
    console.error('Token retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve token' }, { status: 500 });
  }
}
