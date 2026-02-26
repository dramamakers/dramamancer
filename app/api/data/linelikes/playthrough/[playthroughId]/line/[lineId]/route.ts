import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/linelikes/playthrough/[playthroughId]/line/[lineId] - Get line likes for a line in a playthrough
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playthroughId: string; lineId: string }> },
) {
  try {
    const { playthroughId, lineId } = await params;
    const user = getLocalUser();
    const userId = user.userId;

    const playthroughIdNum = parseInt(playthroughId);
    const lineIdNum = parseInt(lineId);
    if (isNaN(playthroughIdNum) || isNaN(lineIdNum)) {
      return NextResponse.json({ error: 'Invalid playthrough or line ID' }, { status: 400 });
    }
    const db = await getDatabase();
    const linelike = await db.get(
      `
      SELECT isLiked FROM linelikes 
      WHERE playthroughId = ? AND lineId = ? AND userId = ?
    `,
      [playthroughIdNum, lineIdNum, userId],
    );

    // Return the like status: null (no vote), true (liked), false (disliked)
    const result = linelike ? linelike.isLiked === 1 : null;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching playthroughs:', error);
    return NextResponse.json({ error: 'Failed to fetch playthroughs' }, { status: 500 });
  }
}
