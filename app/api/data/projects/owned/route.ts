import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';
import { parseProject } from '../utils';

// GET /api/projects/owned - Get projects owned by the current user
export async function GET(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const db = await getDatabase();

    const projects = await db.all(
      `
      SELECT 
        p.id,
        p.title,
        p.settings,
        p.updatedAt,
        p.userId,
        p.createdAt,
        p.version,
        p.cartridge,
        COALESCE(SUM(CASE WHEN pl.lines IS NOT NULL THEN json_array_length(pl.lines) ELSE 0 END), 0) as totalLines,
        COUNT(DISTINCT prl.id) as totalLikes,
        u.displayName as userDisplayName
      FROM projects p
      LEFT JOIN playthroughs pl ON p.id = pl.projectId
      LEFT JOIN projectlikes prl ON p.id = prl.projectId
      LEFT JOIN users u ON p.userId = u.userId
      WHERE p.userId = ?
      GROUP BY p.id
      ORDER BY p.updatedAt DESC
    `,
      [userId],
    );

    return NextResponse.json(projects.map((project) => parseProject(project)));
  } catch (error) {
    console.error('Error fetching owned projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
