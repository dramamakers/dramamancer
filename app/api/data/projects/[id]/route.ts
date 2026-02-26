import { safeJsonParse } from '@/app/api/utils';
import { getLocalUser } from '@/app/api/shared/local-user';
import { getDefaultProject } from '@/app/constants';
import { Project } from '@/app/types';
import { getDatabase } from '@/utils/db';
import { sanitizeCartridge } from '@/utils/validate';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/[id] - Get a specific project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const project = await db.get(
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
      WHERE p.id = ?
      GROUP BY p.id
    `,
      [id],
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse JSON fields with better error handling
    let parsedProject: Project;
    const defaultProject = getDefaultProject(project.userId as string);
    try {
      const rawCartridge =
        safeJsonParse<Project['cartridge']>(project.cartridge, 'cartridge') ||
        defaultProject.cartridge;

      // Sanitize cartridge to fix any data consistency issues (e.g., trigger UUIDs)
      const sanitizedCartridge = sanitizeCartridge(rawCartridge);

      parsedProject = {
        id: project.id,
        title: project.title as string,
        updatedAt: project.updatedAt as number,
        userId: project.userId as string,
        createdAt: project.createdAt as number,
        cartridge: sanitizedCartridge,
        settings:
          safeJsonParse<Project['settings']>(project.settings, 'settings') ||
          defaultProject.settings,
        version: project.version,
        totalLines: project.totalLines || 0,
        totalLikes: project.totalLikes || 0,
        userDisplayName: project.userDisplayName as string,
      };
    } catch (parseError) {
      console.error('JSON parsing error for project', id, ':', parseError);
      return NextResponse.json({ error: 'Corrupted project data' }, { status: 500 });
    }

    // Public or unlisted projects can be viewed by anyone
    if (
      parsedProject.settings.visibility === 'public' ||
      parsedProject.settings.visibility === 'unlisted'
    ) {
      return NextResponse.json(parsedProject);
    }

    // Private projects can only be viewed by the owner
    const user = getLocalUser();
    if (parsedProject.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json(parsedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getLocalUser();
    const userId = user.userId;
    let update;
    try {
      update = await request.json();
    } catch (parseError) {
      console.error('JSON parsing error in request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const db = await getDatabase();
    const project = await db.get(
      'SELECT id, title, settings, cartridge, version, updatedAt, userId, createdAt FROM projects WHERE id = ?',
      [id],
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to update this project' }, { status: 403 });
    }

    // Parse JSON fields from existing project
    const defaultProject = getDefaultProject(userId);
    const current = {
      id: project.id,
      title: project.title as string,
      cartridge:
        safeJsonParse<Project['cartridge']>(project.cartridge, 'cartridge') ||
        defaultProject.cartridge,
      settings:
        safeJsonParse<Project['settings']>(project.settings, 'settings') || defaultProject.settings,
      version: project.version,
      userId: project.userId as string,
      updatedAt: project.updatedAt as number,
      createdAt: project.createdAt as number,
    } as Project;

    // Apply incoming updates to obtain prospective state
    let nextCartridge = current.cartridge;
    if (update.cartridge !== undefined) {
      // Sanitize cartridge updates to fix any AI generation issues
      nextCartridge = sanitizeCartridge(update.cartridge);
    }

    const nextProject: Project = {
      ...current,
      ...(update.title !== undefined ? { title: update.title } : {}),
      ...(update.settings !== undefined ? { settings: update.settings } : {}),
      ...(update.version !== undefined ? { version: update.version } : {}),
      cartridge: nextCartridge,
    } as Project;

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (update.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(nextProject.title);
    }
    if (update.settings !== undefined) {
      updateFields.push('settings = ?');
      updateValues.push(JSON.stringify(nextProject.settings));
    }
    if (update.version !== undefined) {
      updateFields.push('version = ?');
      updateValues.push(nextProject.version);
    }
    if (update.cartridge !== undefined) {
      updateFields.push('cartridge = ?');
      updateValues.push(JSON.stringify(nextProject.cartridge));
    }

    // Always update the updatedAt timestamp
    updateFields.push('updatedAt = ?');
    updateValues.push(Date.now());

    if (updateFields.length > 0) {
      updateValues.push(id);
      await db.run(`UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = getLocalUser();
    const userId = user.userId;

    const db = await getDatabase();
    const project = await db.get(
      'SELECT id, title, settings, cartridge, version, updatedAt, userId, createdAt FROM projects WHERE id = ?',
      [id],
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this project' }, { status: 403 });
    }

    await db.run('DELETE FROM projects WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
