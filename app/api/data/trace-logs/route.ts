import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/trace-logs - Create a new trace log
export async function POST(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const { projectId, action, context, sessionId } = await request.json();
    const timestamp = Date.now();

    const db = await getDatabase();
    await db.run(
      `
      INSERT INTO traces (timestamp, userId, projectId, action, context, sessionId)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [timestamp, userId, projectId, action, context ? JSON.stringify(context) : null, sessionId],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating trace log:', error);
    return NextResponse.json({ error: 'Failed to create trace log' }, { status: 500 });
  }
}
