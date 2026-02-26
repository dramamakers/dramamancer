import { getLocalUser } from '@/app/api/shared/local-user';
import { getDefaultProject } from '@/app/constants';
import { getDatabase } from '@/utils/db';
import { upsertUser } from '@/utils/user';
import { sanitizeCartridge } from '@/utils/validate';
import { NextRequest, NextResponse } from 'next/server';
import { parseProject } from './utils';

// GET /api/projects - Get public projects with optional search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const db = await getDatabase();

    let whereClause = 'WHERE json_extract(settings, "$.visibility") = "public"';
    const queryParams: string[] = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR json_extract(settings, "$.shortDescription") LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (genre) {
      whereClause += ' AND json_extract(settings, "$.genre") = ?';
      queryParams.push(genre);
    }

    const query = `
      SELECT
        p.id,
        p.title,
        p.settings,
        p.updatedAt,
        p.userId,
        p.createdAt,
        p.version,
        p.cartridge,
        COALESCE(SUM(CASE WHEN pl.lines IS NOT NULL THEN json_array_length(pl.lines) ELSE 0 END), 0) as totalLines,
        COUNT(DISTINCT b.id) as totalLikes,
        u.displayName as userDisplayName
      FROM projects p
      LEFT JOIN playthroughs pl ON p.id = pl.projectId
      LEFT JOIN projectlikes b ON p.id = b.projectId
      LEFT JOIN users u ON p.userId = u.userId
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.updatedAt DESC
      ${limit ? `LIMIT ${limit}` : ''}
      ${offset ? `OFFSET ${offset}` : ''}
    `;

    const projects = await db.all(query, [...queryParams, limit, offset]);
    return NextResponse.json(
      projects.map((project) => parseProject(project, { includeLikeCount: true })),
    );
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const user = getLocalUser();
    const rawProject = await request.json();
    const userId = user.userId;
    const userDisplayName = user.displayName || 'Anonymous';
    const now = Date.now();

    // Upsert user in users table
    await upsertUser(userId, userDisplayName);
    const db = await getDatabase();
    const defaultProject = getDefaultProject(userId);
    const project = {
      ...defaultProject,
      ...rawProject,
      userId,
      updatedAt: now,
    };

    // Sanitize the cartridge to fix any AI generation issues
    const mergedCartridge = {
      ...defaultProject.cartridge,
      ...project.cartridge,
    };
    const sanitizedCartridge = sanitizeCartridge(mergedCartridge);

    const result = await db.run(
      `
      INSERT INTO projects (title, settings, cartridge, version, updatedAt, userId)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        project.title || '',
        JSON.stringify({
          ...defaultProject.settings,
          ...project.settings,
        }),
        JSON.stringify(sanitizedCartridge),
        'dramamancer-v1',
        now,
        userId,
      ],
    );

    return NextResponse.json({ id: result.lastID });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
