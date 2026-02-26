import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/data/playthroughs/user - Get authenticated user's playthroughs (all visibilities)
export async function GET(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const limit = request.nextUrl.searchParams.get('limit');
    const offset = request.nextUrl.searchParams.get('offset');
    const db = await getDatabase();

    const playthroughs = await db.all(
      `
			SELECT p.*, u.displayName as userDisplayName,
				COALESCE((SELECT COUNT(*) FROM playthrough_likes pl WHERE pl.playthroughId = p.id), 0) as totalLikes
			FROM playthroughs p
			LEFT JOIN users u ON p.userId = u.userId
			WHERE p.userId = ? AND json_array_length(p.lines) > 5
			ORDER BY p.createdAt DESC
			${limit ? `LIMIT ${parseInt(limit)}` : ''}
			${offset ? `OFFSET ${parseInt(offset)}` : ''}
		`,
      [userId],
    );

    const parsed = playthroughs.map(
      (pt: {
        lines: string;
        projectSnapshot: string;
        liked: boolean;
        visibility: string;
        totalLikes: number;
      }) => ({
        ...pt,
        lines: JSON.parse(pt.lines),
        projectSnapshot: JSON.parse(pt.projectSnapshot),
        liked: Boolean(pt.liked),
        visibility: pt.visibility || 'private',
        totalLikes: pt.totalLikes || 0,
      }),
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching my playthroughs:', error);
    return NextResponse.json({ error: 'Failed to fetch playthroughs' }, { status: 500 });
  }
}
