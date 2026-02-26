import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { setUserImageUrl } from '@/utils/user';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
      const db = await getDatabase();
      const row = await db.get<{
        displayName: string;
        imageUrl: string | null;
      }>('SELECT displayName, imageUrl FROM users WHERE userId = ?', [userId]);

      if (row) {
        return NextResponse.json({
          displayName: row.displayName,
          imageUrl: row.imageUrl ?? null,
        });
      }

      return NextResponse.json({
        displayName: `User ${userId.slice(0, 8)}`,
        imageUrl: null,
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      return NextResponse.json({
        displayName: `User ${userId.slice(0, 8)}`,
        imageUrl: null,
      });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = getLocalUser();
    if (user.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { imageUrl } = await request.json();
    if (imageUrl !== null && imageUrl !== undefined && typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid imageUrl' }, { status: 400 });
    }
    if (imageUrl !== null && imageUrl !== undefined) {
      await setUserImageUrl(userId, imageUrl ?? null);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user image:', error);
    return NextResponse.json({ error: 'Failed to update user image' }, { status: 500 });
  }
}
