import fs from 'fs/promises';
import path from 'path';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  const dataDirName = process.env.DATA_DIR ?? 'data';
  const dbPath = path.join(process.cwd(), dataDirName, 'dramamancer.db');
  const dataDir = path.dirname(dbPath);

  await fs.mkdir(dataDir, { recursive: true });

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA foreign_keys = ON');
  await createTables(db);

  return db;
}

async function createTables(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      userId TEXT PRIMARY KEY,
      displayName TEXT NOT NULL,
      imageUrl TEXT,
      updatedAt INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      settings TEXT NOT NULL,
      updatedAt INTEGER NOT NULL,
      userId TEXT NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000),
      version TEXT,
      cartridge TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS playthroughs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      lines TEXT NOT NULL,
      currentLineIdx INTEGER NOT NULL,
      currentSceneId TEXT,
      updatedAt INTEGER NOT NULL,
      projectSnapshot TEXT NOT NULL,
      liked INTEGER DEFAULT 0 NOT NULL,
      visibility TEXT DEFAULT 'private' NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000),
      title TEXT,
      FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS contentflags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      entityId INTEGER NOT NULL,
      entity TEXT NOT NULL,
      approved INTEGER DEFAULT 0 NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000)
    )
  `);
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contentflags_type_entity ON contentflags(type, entityId);
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS traces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      userId TEXT NOT NULL,
      projectId INTEGER,
      action TEXT NOT NULL,
      context TEXT,
      sessionId TEXT,
      createdAt INTEGER DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE SET NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS projectlikes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      projectId INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(userId, projectId)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      projectId INTEGER NOT NULL,
      chatState TEXT NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000),
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE
    )
  `);
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chats_user_project ON chats(userId, projectId, updatedAt DESC);
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS linelikes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      playthroughId INTEGER NOT NULL,
      lineId INTEGER NOT NULL,
      isLiked INTEGER DEFAULT 1 NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (playthroughId) REFERENCES playthroughs (id) ON DELETE CASCADE,
      UNIQUE(userId, playthroughId, lineId)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS playthrough_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      playthroughId INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (playthroughId) REFERENCES playthroughs (id) ON DELETE CASCADE,
      UNIQUE(userId, playthroughId)
    )
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_userId ON users (userId);
    CREATE INDEX IF NOT EXISTS idx_users_displayName ON users (displayName);
    CREATE INDEX IF NOT EXISTS idx_projects_userId ON projects (userId);
    CREATE INDEX IF NOT EXISTS idx_projects_userId_updatedAt ON projects (userId, updatedAt);
    CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects (json_extract(settings, '$.visibility'));
    CREATE INDEX IF NOT EXISTS idx_playthroughs_userId ON playthroughs (userId);
    CREATE INDEX IF NOT EXISTS idx_playthroughs_projectId_userId ON playthroughs (projectId, userId);
    CREATE INDEX IF NOT EXISTS idx_playthroughs_projectId_updatedAt ON playthroughs (projectId, updatedAt);
    CREATE INDEX IF NOT EXISTS idx_playthroughs_visibility ON playthroughs (visibility);
    CREATE INDEX IF NOT EXISTS idx_playthroughs_userId_visibility ON playthroughs (userId, visibility);
    CREATE INDEX IF NOT EXISTS idx_playthroughs_liked ON playthroughs (liked);
    CREATE INDEX IF NOT EXISTS idx_playthroughs_userId_liked ON playthroughs (userId, liked);
    CREATE INDEX IF NOT EXISTS idx_traces_userId_timestamp ON traces (userId, timestamp);
    CREATE INDEX IF NOT EXISTS idx_traces_projectId ON traces (projectId);
    CREATE INDEX IF NOT EXISTS idx_traces_action ON traces (action);
    CREATE INDEX IF NOT EXISTS idx_traces_sessionId ON traces (sessionId);
    CREATE INDEX IF NOT EXISTS idx_projectlikes_userId ON projectlikes (userId);
    CREATE INDEX IF NOT EXISTS idx_projectlikes_projectId ON projectlikes (projectId);
    CREATE INDEX IF NOT EXISTS idx_projectlikes_userId_projectId ON projectlikes (userId, projectId);
    CREATE INDEX IF NOT EXISTS idx_linelikes_userId ON linelikes (userId);
    CREATE INDEX IF NOT EXISTS idx_linelikes_playthroughId ON linelikes (playthroughId);
    CREATE INDEX IF NOT EXISTS idx_linelikes_lineId ON linelikes (lineId);
    CREATE INDEX IF NOT EXISTS idx_linelikes_userId_playthroughId_lineId ON linelikes (userId, playthroughId, lineId);
    CREATE INDEX IF NOT EXISTS idx_playthrough_likes_userId ON playthrough_likes (userId);
    CREATE INDEX IF NOT EXISTS idx_playthrough_likes_playthroughId ON playthrough_likes (playthroughId);
    CREATE INDEX IF NOT EXISTS idx_playthrough_likes_userId_playthroughId ON playthrough_likes (userId, playthroughId);
  `);
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}
