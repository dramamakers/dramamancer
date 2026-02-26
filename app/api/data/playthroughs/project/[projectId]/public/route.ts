import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';
import { parsePlaythrough } from '../../../utils';

// GET /api/data/playthroughs/project/[projectId]/public - Get public playthroughs for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const projectIdNum = parseInt(projectId);
    const limit = request.nextUrl.searchParams.get('limit');
    const offset = request.nextUrl.searchParams.get('offset');
    const excludeSelf = request.nextUrl.searchParams.get('excludeSelf') === 'true';

    let currentUserId: string | null = null;
    if (excludeSelf) {
      currentUserId = getLocalUser().userId;
    }

    const db = await getDatabase();
    const whereClause = currentUserId
      ? "p.projectId = ? AND p.visibility = 'public' AND p.userId != ?"
      : "p.projectId = ? AND p.visibility = 'public'";
    const queryParams = currentUserId ? [projectIdNum, currentUserId] : [projectIdNum];

    const playthroughs = await db.all(
      `
      SELECT p.*, u.displayName as userDisplayName,
        COALESCE((SELECT COUNT(*) FROM playthrough_likes pl WHERE pl.playthroughId = p.id), 0) as totalLikes
      FROM playthroughs p
      LEFT JOIN users u ON p.userId = u.userId
      WHERE ${whereClause}
      ORDER BY json_array_length(p.lines) DESC, p.createdAt DESC
      ${limit ? `LIMIT ${parseInt(limit)}` : ''}
      ${offset ? `OFFSET ${parseInt(offset)}` : ''}
    `,
      queryParams,
    );

    return NextResponse.json(playthroughs.map(parsePlaythrough));
  } catch (error) {
    console.error('Error fetching public playthroughs:', error);
    return NextResponse.json({ error: 'Failed to fetch public playthroughs' }, { status: 500 });
  }
}
