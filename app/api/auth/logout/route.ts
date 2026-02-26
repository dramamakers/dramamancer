export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

/**
 * Public version: no-op. User never logged in, so never logged out; session cookie is not cleared.
 */
export async function POST() {
  return NextResponse.json({ success: true });
}
