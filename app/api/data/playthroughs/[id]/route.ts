import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';
import { parsePlaythrough } from '../utils';

// GET /api/playthroughs/[id] - Get a specific playthrough
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const db = await getDatabase();
    const playthrough = await db.get(
      `
      SELECT 
        p.*,
        u.displayName as userDisplayName
      FROM playthroughs p
      LEFT JOIN users u ON p.userId = u.userId
      WHERE p.id = ?
      `,
      [id],
    );

    if (!playthrough) {
      return NextResponse.json({ error: 'Playthrough not found' }, { status: 404 });
    }

    return NextResponse.json(parsePlaythrough(playthrough));
  } catch (error) {
    console.error('Error fetching playthrough:', error);
    return NextResponse.json({ error: 'Failed to fetch playthrough' }, { status: 500 });
  }
}

// PATCH /api/playthroughs/[id] - Update a playthrough
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getLocalUser();
    const userId = user.userId;

    let update;
    try {
      update = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      throw error;
    }

    const db = await getDatabase();
    const playthroughResponse = await db.get('SELECT * FROM playthroughs WHERE id = ?', [id]);

    if (!playthroughResponse) {
      return NextResponse.json({ error: 'Playthrough not found' }, { status: 404 });
    }

    const playthrough = {
      ...parsePlaythrough(playthroughResponse),
      ...update,
    };

    if (playthrough.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this playthrough' },
        { status: 403 },
      );
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (update.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(update.title);
    }
    if (update.lines !== undefined) {
      updateFields.push('lines = ?');
      updateValues.push(JSON.stringify(update.lines));
    }
    if (update.currentLineIdx !== undefined) {
      updateFields.push('currentLineIdx = ?');
      updateValues.push(update.currentLineIdx);
    }
    if (update.currentSceneId !== undefined) {
      updateFields.push('currentSceneId = ?');
      updateValues.push(update.currentSceneId);
    }
    // currentSceneStartIdx deprecated and removed
    if (update.liked !== undefined) {
      updateFields.push('liked = ?');
      updateValues.push(update.liked ? 1 : 0);
    }
    if (update.visibility !== undefined) {
      updateFields.push('visibility = ?');
      updateValues.push(update.visibility);
    }
    if (update.projectSnapshot !== undefined) {
      updateFields.push('projectSnapshot = ?');
      updateValues.push(JSON.stringify(update.projectSnapshot));
    }

    // Always update the updatedAt timestamp
    updateFields.push('updatedAt = ?');
    updateValues.push(Date.now());

    if (updateFields.length > 0) {
      updateValues.push(id);
      await db.run(`UPDATE playthroughs SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Error updating playthrough:', error);
    return NextResponse.json({ error: 'Failed to update playthrough' }, { status: 500 });
  }
}
