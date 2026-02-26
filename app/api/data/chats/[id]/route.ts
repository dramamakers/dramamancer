import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/data/chats/[id] - Update an existing chat
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getLocalUser();
    const userId = user.userId;
    const { chatState } = await request.json();

    if (!chatState) {
      return NextResponse.json({ error: 'Missing chatState' }, { status: 400 });
    }

    const db = await getDatabase();

    const chat = await db.get('SELECT id, userId FROM chats WHERE id = ?', [id]);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    if (chat.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const now = Date.now();
    await db.run('UPDATE chats SET chatState = ?, updatedAt = ? WHERE id = ?', [
      JSON.stringify(chatState),
      now,
      id,
    ]);

    return NextResponse.json({ id, chatState });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

// DELETE /api/data/chats/[id] - Delete a chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = getLocalUser();
    const userId = user.userId;
    const db = await getDatabase();

    const chat = await db.get('SELECT id, userId FROM chats WHERE id = ?', [id]);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await db.run('DELETE FROM chats WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
