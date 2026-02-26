import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/data/chats/list?projectId=X - Get all chats for a project
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

    // Get all chats for this user and project, ordered by most recent first
    const chats = await db.all(
      'SELECT id, createdAt, updatedAt, chatState FROM chats WHERE userId = ? AND projectId = ? ORDER BY updatedAt DESC',
      [userId, projectId],
    );

    // Parse chatState and extract last message for each chat
    const chatsWithLastMessage = chats.map(
      (chat: { id: number; createdAt: number; updatedAt: number; chatState: string }) => {
        try {
          const state = JSON.parse(chat.chatState);
          const messages = state.messages || [];
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

          // Extract text from last message
          let lastMessageText = '';
          if (lastMessage) {
            const textContent = lastMessage.content?.find(
              (c: { type: string }) => c.type === 'text',
            );
            lastMessageText = textContent?.text || '';
          }

          return {
            id: chat.id,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            lastMessage: lastMessageText,
          };
        } catch (error) {
          console.error('Error parsing chat state:', error);
          return {
            id: chat.id,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            lastMessage: '',
          };
        }
      },
    );

    return NextResponse.json({ chats: chatsWithLastMessage });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}
