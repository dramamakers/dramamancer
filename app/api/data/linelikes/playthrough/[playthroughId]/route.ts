import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/linelikes/playthrough/[playthroughId] - Get line likes for lines in a playthrough
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playthroughId: string }> },
) {
  try {
    const { playthroughId } = await params;
    const user = getLocalUser();
    const userId = user.userId;

    const playthroughIdNum = parseInt(playthroughId);
    if (isNaN(playthroughIdNum)) {
      return NextResponse.json({ error: 'Invalid playthrough ID' }, { status: 400 });
    }
    const db = await getDatabase();
    const linelikes = await db.all(
      `
      SELECT lineId, isLiked FROM linelikes 
      WHERE playthroughId = ? AND userId = ?
    `,
      [playthroughIdNum, userId],
    );

    // Return object with liked and disliked line IDs
    const liked = linelikes.filter((like) => like.isLiked === 1).map((like) => like.lineId);
    const disliked = linelikes.filter((like) => like.isLiked === 0).map((like) => like.lineId);

    return NextResponse.json({ liked, disliked });
  } catch (error) {
    console.error('Error fetching playthroughs:', error);
    return NextResponse.json({ error: 'Failed to fetch playthroughs' }, { status: 500 });
  }
}
