import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/data/playthroughlikes/playthrough/[playthroughId]
// Returns { totalLikes: number } - total count of likes for this playthrough
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playthroughId: string }> },
) {
  try {
    const { playthroughId } = await params;
    const idNum = parseInt(playthroughId, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: 'Invalid playthroughId' }, { status: 400 });
    }

    const db = await getDatabase();
    const row = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM playthrough_likes WHERE playthroughId = ?',
      idNum,
    );

    return NextResponse.json({ totalLikes: row?.count ?? 0 });
  } catch (error) {
    console.error('Error fetching playthrough like count:', error);
    return NextResponse.json({ error: 'Failed to fetch like count' }, { status: 500 });
  }
}
