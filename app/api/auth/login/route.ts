export const runtime = 'nodejs';
import { getLocalUserForAuth } from '@/app/api/auth/utils';
import { upsertUser } from '@/utils/user';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const user = await getLocalUserForAuth(idToken);

    if (!user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    await upsertUser(user.userId, user.displayName || 'Anonymous');

    const responseWithAllowed = NextResponse.json({
      success: true,
      user,
    });

    // Set secure cookie with shorter expiration for better security
    responseWithAllowed.cookies.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return responseWithAllowed;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
