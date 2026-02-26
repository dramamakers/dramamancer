import { getLocalUser } from '@/app/api/shared/local-user';
import { CURRENT_PROJECT_VERSION } from '@/app/constants';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/projects/[id]/remix - Remix a project
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getLocalUser();
    const userId = user.userId;
    const db = await getDatabase();

    // Get the original project
    const originalProject = await db.get(
      'SELECT id, title, settings, cartridge, version, updatedAt, userId, createdAt FROM projects WHERE id = ?',
      [parseInt(id)],
    );
    if (!originalProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectSettings = JSON.parse(originalProject.settings);
    if (!projectSettings.remixable) {
      return NextResponse.json({ error: 'This project is not remixable' }, { status: 401 });
    }

    const now = Date.now();
    const result = await db.run(
      `
      INSERT INTO projects (title, settings, cartridge, version, updatedAt, userId)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        `${originalProject.title} (Copy)`.trim(),
        JSON.stringify({
          ...JSON.parse(originalProject.settings),
          visibility: 'private',
        }),
        originalProject.cartridge,
        originalProject.version || CURRENT_PROJECT_VERSION,
        now,
        userId,
      ],
    );

    return NextResponse.json({ id: result.lastID });
  } catch (error) {
    console.error('Error remixing project:', error);
    return NextResponse.json({ error: 'Failed to remix project' }, { status: 500 });
  }
}
