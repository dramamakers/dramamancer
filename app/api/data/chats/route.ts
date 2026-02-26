import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/data/chats - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const { projectId, chatState } = await request.json();

    if (!projectId || !chatState) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDatabase();

    const project = await db.get('SELECT id, userId FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    if (project.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const now = Date.now();
    const result = await db.run(
      'INSERT INTO chats (userId, projectId, chatState, updatedAt) VALUES (?, ?, ?, ?)',
      [userId, projectId, JSON.stringify(chatState), now],
    );

    return NextResponse.json({ id: result.lastID, chatState });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
