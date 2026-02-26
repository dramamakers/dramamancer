import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projectlikes - Get user's liked projects
export async function GET(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const db = await getDatabase();

    const likedProjects = await db.all(
      `
      SELECT 
        p.*,
        COALESCE(SUM(CASE WHEN pl.lines IS NOT NULL THEN json_array_length(pl.lines) ELSE 0 END), 0) as totalLines,
        COALESCE(SUM(CASE WHEN ll.isLiked = 1 THEN 1 ELSE 0 END), 0) as totalLikes
      FROM projects p
      INNER JOIN projectlikes b ON p.id = b.projectId
      LEFT JOIN playthroughs pl ON p.id = pl.projectId
      LEFT JOIN linelikes ll ON pl.id = ll.playthroughId
      WHERE b.userId = ? AND json_extract(p.settings, '$.visibility') IN ('public', 'unlisted')
      GROUP BY p.id
      ORDER BY b.createdAt DESC
    `,
      [userId],
    );

    return NextResponse.json(
      likedProjects.map((project) => ({
        ...project,
        settings: JSON.parse(project.settings),
        cartridge: JSON.parse(project.cartridge),
        totalLines: project.totalLines || 0,
        totalLikes: project.totalLikes || 0,
      })),
    );
  } catch (error) {
    console.error('Error fetching liked projects:', error);
    return NextResponse.json({ error: 'Failed to fetch liked projects' }, { status: 500 });
  }
}

// POST /api/projectlikes - Add a project like
export async function POST(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const { projectId } = await request.json();

    const db = await getDatabase();

    // Check if project exists and is public or unlisted
    const project = await db.get(
      'SELECT id, title, settings, cartridge, version, updatedAt, userId, createdAt FROM projects WHERE id = ? AND json_extract(settings, "$.visibility") IN ("public", "unlisted")',
      [projectId],
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found or not public' }, { status: 404 });
    }

    // Add project like (UNIQUE constraint will prevent duplicates)
    await db.run('INSERT OR IGNORE INTO projectlikes (userId, projectId) VALUES (?, ?)', [
      userId,
      projectId,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding project like:', error);
    return NextResponse.json({ error: 'Failed to add project like' }, { status: 500 });
  }
}

// DELETE /api/projectlikes - Remove a project like
export async function DELETE(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const db = await getDatabase();

    await db.run('DELETE FROM projectlikes WHERE userId = ? AND projectId = ?', [
      userId,
      projectId,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing project like:', error);
    return NextResponse.json({ error: 'Failed to remove project like' }, { status: 500 });
  }
}
