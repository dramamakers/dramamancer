import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/data/chats/[id]/load - Load a specific chat
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getLocalUser();
    const userId = user.userId;
    const db = await getDatabase();

    const chat = await db.get(
      'SELECT id, chatState, createdAt, updatedAt, userId FROM chats WHERE id = ?',
      [id],
    );

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    if (chat.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({
      id: chat.id,
      chatState: JSON.parse(chat.chatState),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    console.error('Error loading chat:', error);
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
  }
}
