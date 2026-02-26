import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';
import { parsePlaythrough } from '../../../utils';

// GET /api/data/playthroughs/user/[userId]/public - Get a user's public playthroughs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const limit = request.nextUrl.searchParams.get('limit');
    const offset = request.nextUrl.searchParams.get('offset');
    const db = await getDatabase();

    const playthroughs = await db.all(
      `
      SELECT p.*, u.displayName as userDisplayName,
        COALESCE((SELECT COUNT(*) FROM playthrough_likes pl WHERE pl.playthroughId = p.id), 0) as totalLikes
      FROM playthroughs p
      LEFT JOIN users u ON p.userId = u.userId
      WHERE p.userId = ? AND p.visibility = 'public' AND json_array_length(p.lines) > 5
      ORDER BY p.createdAt DESC
      ${limit ? `LIMIT ${parseInt(limit)}` : ''}
      ${offset ? `OFFSET ${parseInt(offset)}` : ''}
    `,
      [userId],
    );

    return NextResponse.json(playthroughs.map(parsePlaythrough));
  } catch (error) {
    console.error('Error fetching user public playthroughs:', error);
    return NextResponse.json({ error: 'Failed to fetch playthroughs' }, { status: 500 });
  }
}
