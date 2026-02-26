import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';
import { parsePlaythrough } from '../../utils';

// GET /api/playthroughs/project/[projectId] - Get playthroughs for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const user = getLocalUser();
    const userId = user.userId;
    const projectIdNum = parseInt(projectId);
    const limit = request.nextUrl.searchParams.get('limit');

    const offset = request.nextUrl.searchParams.get('offset');

    const db = await getDatabase();
    const playthroughs = await db.all(
      `
      SELECT p.*, u.displayName as userDisplayName,
        COALESCE((SELECT COUNT(*) FROM playthrough_likes pl WHERE pl.playthroughId = p.id), 0) as totalLikes
      FROM playthroughs p
      LEFT JOIN users u ON p.userId = u.userId
      WHERE p.projectId = ? AND p.userId = ? AND json_array_length(p.lines) > 1
      ORDER BY json_array_length(p.lines) DESC, p.createdAt DESC
      ${limit ? `LIMIT ${parseInt(limit)}` : ''}
      ${offset ? `OFFSET ${parseInt(offset)}` : ''}
    `,
      [projectIdNum, userId],
    );

    return NextResponse.json(playthroughs.map(parsePlaythrough));
  } catch (error) {
    console.error('Error fetching playthroughs:', error);
    return NextResponse.json({ error: 'Failed to fetch playthroughs' }, { status: 500 });
  }
}
