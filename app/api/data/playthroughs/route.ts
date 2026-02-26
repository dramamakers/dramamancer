import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { getStartingScene } from '@/utils/game';
import { getSceneTransitionLines } from '@/utils/lines';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/playthroughs - Create a new playthrough
export async function POST(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const requestBody = await request.json();
    const { projectId, projectSnapshot, lines, currentLineIdx, currentSceneId } = requestBody;

    const db = await getDatabase();
    const now = Date.now();

    // Initialize playthrough with the given project snapshot
    const { scenes, characters } = projectSnapshot.cartridge;
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: 'Project has no scenes' }, { status: 400 });
    }

    if (!characters || !Array.isArray(characters) || characters.length === 0) {
      return NextResponse.json({ error: 'Project has no characters' }, { status: 400 });
    }

    const startingScene = getStartingScene(projectSnapshot);
    const linesJson = JSON.stringify([
      ...(lines ||
        (await getSceneTransitionLines({
          newScene: startingScene,
        }))),
    ]);

    const insertQuery = `
      INSERT INTO playthroughs (projectId, userId, lines, currentLineIdx, currentSceneId, updatedAt, projectSnapshot, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.run(insertQuery, [
      projectId,
      userId,
      linesJson,
      currentLineIdx ?? 0,
      currentSceneId ?? startingScene.uuid,
      now,
      JSON.stringify(projectSnapshot),
      'public',
    ]);

    const playthrough = await db.get('SELECT * FROM playthroughs WHERE id = ?', [result.lastID]);

    if (!playthrough) {
      throw new Error('Failed to find newly created playthrough');
    }

    const response = {
      ...playthrough,
      lines: JSON.parse(playthrough.lines),
      projectSnapshot: JSON.parse(playthrough.projectSnapshot),
      liked: Boolean(playthrough.liked),
      visibility: playthrough.visibility || 'private',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating playthrough:', error);
    return NextResponse.json({ error: 'Failed to create playthrough' }, { status: 500 });
  }
}
