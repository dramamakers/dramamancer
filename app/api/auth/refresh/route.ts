export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getLocalUserForAuth } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    // Verify the new token and get user info
    const user = await getLocalUserForAuth(idToken);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Note: We don't check isAuthorized here - authorization is handled in individual API routes
    // This matches the login endpoint behavior to allow all authenticated users to refresh their tokens

    // Create response
    const response = NextResponse.json({
      success: true,
      user: user,
    });

    // Update the session cookie with the fresh token (30-day expiration)
    response.cookies.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
  }
}
