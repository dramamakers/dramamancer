import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/data/chats/latest?projectId=X - Get the latest chat for a project
export async function GET(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 });
    }

    const db = await getDatabase();

    const project = await db.get('SELECT id, userId FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    if (project.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get the latest chat for this user and project
    const chat = await db.get(
      'SELECT id, chatState, createdAt, updatedAt FROM chats WHERE userId = ? AND projectId = ? ORDER BY updatedAt DESC LIMIT 1',
      [userId, projectId],
    );

    if (!chat) {
      return NextResponse.json({ chat: null });
    }

    return NextResponse.json({
      id: chat.id,
      chatState: JSON.parse(chat.chatState),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching latest chat:', error);
    return NextResponse.json({ error: 'Failed to fetch latest chat' }, { status: 500 });
  }
}
