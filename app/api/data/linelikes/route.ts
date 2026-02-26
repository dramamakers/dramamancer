import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/linelikes - Add a line like or dislike
export async function POST(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const { playthroughId, lineId, isLiked } = await request.json();

    const db = await getDatabase();

    // Add or update line like/dislike (UNIQUE constraint will prevent duplicates)
    await db.run(
      'INSERT OR REPLACE INTO linelikes (userId, playthroughId, lineId, isLiked) VALUES (?, ?, ?, ?)',
      [userId, playthroughId, lineId, isLiked ? 1 : 0],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding line like:', error);
    return NextResponse.json({ error: 'Failed to add line like' }, { status: 500 });
  }
}

// DELETE /api/linelikes - Remove a line like/dislike
export async function DELETE(request: NextRequest) {
  try {
    const user = getLocalUser();

    const { searchParams } = new URL(request.url);
    const playthroughId = searchParams.get('playthroughId');
    const lineId = searchParams.get('lineId');

    if (!playthroughId) {
      return NextResponse.json({ error: 'Playthrough ID is required' }, { status: 400 });
    }

    const userId = user.userId as string;
    const db = await getDatabase();

    await db.run('DELETE FROM linelikes WHERE userId = ? AND playthroughId = ? AND lineId = ?', [
      userId,
      playthroughId,
      lineId,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing line like:', error);
    return NextResponse.json({ error: 'Failed to remove line like' }, { status: 500 });
  }
}
