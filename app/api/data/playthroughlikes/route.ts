import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/data/playthroughlikes - Get playthroughIds liked by the current user
export async function GET(request: NextRequest) {
  try {
    const user = getLocalUser();
    const db = await getDatabase();
    const rows = await db.all<{ playthroughId: number }[]>(
      'SELECT playthroughId FROM playthrough_likes WHERE userId = ?',
      [user.userId],
    );

    return NextResponse.json(rows.map((r: { playthroughId: number }) => r.playthroughId));
  } catch (error) {
    console.error('Error fetching playthrough likes:', error);
    return NextResponse.json({ error: 'Failed to fetch playthrough likes' }, { status: 500 });
  }
}

// POST /api/data/playthroughlikes - Like a playthrough
export async function POST(request: NextRequest) {
  try {
    const user = getLocalUser();
    const { playthroughId } = await request.json();
    if (!playthroughId) {
      return NextResponse.json({ error: 'Missing playthroughId' }, { status: 400 });
    }

    const db = await getDatabase();

    // Check if playthrough exists
    const playthrough = await db.get('SELECT id FROM playthroughs WHERE id = ?', [playthroughId]);
    if (!playthrough) {
      return NextResponse.json({ error: 'Playthrough not found' }, { status: 404 });
    }

    // Check if user has already liked this playthrough
    const existingLike = await db.get(
      'SELECT id FROM playthrough_likes WHERE userId = ? AND playthroughId = ?',
      [user.userId, playthroughId],
    );

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 409 });
    }

    // Add the like
    await db.run('INSERT INTO playthrough_likes (userId, playthroughId) VALUES (?, ?)', [
      user.userId,
      playthroughId,
    ]);

    // Update the total like count in the playthroughs table
    await db.run(
      'UPDATE playthroughs SET liked = (SELECT COUNT(*) FROM playthrough_likes WHERE playthroughId = ?) WHERE id = ?',
      [playthroughId, playthroughId],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking playthrough:', error);
    return NextResponse.json({ error: 'Failed to like playthrough' }, { status: 500 });
  }
}

// DELETE /api/data/playthroughlikes?playthroughId=ID - Unlike a playthrough
export async function DELETE(request: NextRequest) {
  try {
    const user = getLocalUser();

    const { searchParams } = new URL(request.url);
    const playthroughId = searchParams.get('playthroughId');

    if (!playthroughId) {
      return NextResponse.json({ error: 'Missing playthroughId' }, { status: 400 });
    }

    const db = await getDatabase();

    // Check if the user has actually liked this playthrough
    const existingLike = await db.get(
      'SELECT id FROM playthrough_likes WHERE userId = ? AND playthroughId = ?',
      [user.userId as string, playthroughId],
    );

    if (!existingLike) {
      return NextResponse.json({ error: 'Not liked' }, { status: 409 });
    }

    // Remove the like
    await db.run('DELETE FROM playthrough_likes WHERE userId = ? AND playthroughId = ?', [
      user.userId as string,
      playthroughId,
    ]);

    // Update the total like count in the playthroughs table
    await db.run(
      'UPDATE playthroughs SET liked = (SELECT COUNT(*) FROM playthrough_likes WHERE playthroughId = ?) WHERE id = ?',
      [playthroughId, playthroughId],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unliking playthrough:', error);
    return NextResponse.json({ error: 'Failed to unlike playthrough' }, { status: 500 });
  }
}
