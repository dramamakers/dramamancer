import { getDatabase } from './db';

// Server-side utility functions for API routes
export async function upsertUser(userId: string, displayName: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run(
      `
      INSERT INTO users (userId, displayName, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        displayName = excluded.displayName,
        updatedAt = excluded.updatedAt
      `,
      [userId, displayName, Date.now()],
    );
  } catch (error) {
    console.error('Error upserting user:', error);
  }
}

export async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const db = await getDatabase();

    // Get from users table (fast O(1) lookup)
    const userResult = await db.get<{ displayName: string }>(
      'SELECT displayName FROM users WHERE userId = ?',
      [userId],
    );

    if (userResult?.displayName) {
      return userResult.displayName;
    }

    // Generate name from email-like userId
    let fallbackName: string;
    if (userId.includes('@')) {
      const emailName = userId.split('@')[0];
      fallbackName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    } else {
      fallbackName = `User ${userId.slice(0, 8)}`;
    }

    // Cache this in users table for future lookups
    await upsertUser(userId, fallbackName);
    return fallbackName;
  } catch (error) {
    console.error('Error getting user display name:', error);
    return `User ${userId.slice(0, 8)}`;
  }
}

export async function getUserProfile(userId: string): Promise<{
  displayName: string;
  imageUrl: string | null;
} | null> {
  try {
    const db = await getDatabase();
    const row = await db.get<{
      displayName: string;
      imageUrl: string | null;
    }>('SELECT displayName, imageUrl FROM users WHERE userId = ?', [userId]);
    if (row) {
      return {
        displayName: row.displayName,
        imageUrl: row.imageUrl ?? null,
      };
    }

    // If not found, synthesize a displayName and upsert
    const displayName = await getUserDisplayName(userId);
    const inserted = await db.get<{ imageUrl: string | null }>(
      'SELECT imageUrl FROM users WHERE userId = ?',
      [userId],
    );
    return {
      displayName,
      imageUrl: inserted?.imageUrl ?? null,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      displayName: `User ${userId.slice(0, 8)}`,
      imageUrl: null,
    };
  }
}

export async function setUserImageUrl(userId: string, imageUrl: string | null): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run('UPDATE users SET imageUrl = ?, updatedAt = ? WHERE userId = ?', [
      imageUrl,
      Date.now(),
      userId,
    ]);
  } catch (error) {
    console.error('Error setting user imageUrl:', error);
    throw error;
  }
}

// Batch lookup for multiple users (useful for admin tables, etc.)
export async function getUserDisplayNames(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};

  try {
    const db = await getDatabase();
    const placeholders = userIds.map(() => '?').join(',');

    const existingUsers = (await db.all(
      `SELECT userId, displayName FROM users WHERE userId IN (${placeholders})`,
      userIds,
    )) as Array<{ userId: string; displayName: string }>;

    const lookup: Record<string, string> = {};
    const missingUserIds: string[] = [];

    // Add existing users to lookup
    existingUsers.forEach((user: { userId: string; displayName: string }) => {
      lookup[user.userId] = user.displayName;
    });

    // Find missing users
    userIds.forEach((userId) => {
      if (!lookup[userId]) {
        missingUserIds.push(userId);
      }
    });

    // Fetch missing users one by one (fallback logic)
    for (const userId of missingUserIds) {
      lookup[userId] = await getUserDisplayName(userId);
    }

    return lookup;
  } catch (error) {
    console.error('Error getting batch user display names:', error);
    // Return fallback names for all users
    const fallbackLookup: Record<string, string> = {};
    userIds.forEach((userId) => {
      fallbackLookup[userId] = `User ${userId.slice(0, 8)}`;
    });
    return fallbackLookup;
  }
}
