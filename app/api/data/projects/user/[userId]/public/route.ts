import { safeJsonParse } from '@/app/api/utils';
import { Project } from '@/app/types';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/data/projects/user/[userId]/public - Get a user's public projects
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
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
      WHERE p.userId = ? AND json_extract(p.settings, '$.visibility') = 'public'
      GROUP BY p.id
      ORDER BY p.updatedAt DESC
    `,
      [userId],
    );

    const parsed = projects.map((project) => ({
      ...project,
      cartridge: safeJsonParse<Project['cartridge']>(project.cartridge, 'cartridge'),
      settings: safeJsonParse<Project['settings']>(project.settings, 'settings'),
      version: project.version,
      totalLines: project.totalLines || 0,
      totalLikes: project.totalLikes || 0,
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching user public projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
