import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/data/projects/recent - Get projects the current user recently played
export async function GET(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const db = await getDatabase();

    // Select the user's most recently played unique projects, with aggregates for display
    const projects = await db.all(
      `
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
        COUNT(DISTINCT prl.id) as totalLikes,
        u.displayName as userDisplayName,
        lp.lastPlayedAt
      FROM (
        SELECT projectId, MAX(createdAt) as lastPlayedAt
        FROM playthroughs
        WHERE userId = ?
        GROUP BY projectId
        ORDER BY lastPlayedAt DESC
        LIMIT ?
      ) lp
      JOIN projects p ON p.id = lp.projectId
      LEFT JOIN playthroughs pl ON p.id = pl.projectId
      LEFT JOIN projectlikes prl ON p.id = prl.projectId
      LEFT JOIN users u ON p.userId = u.userId
      WHERE json_extract(p.settings, '$.visibility') IN ('public', 'unlisted') OR p.userId = ?
      GROUP BY p.id
      ORDER BY lp.lastPlayedAt DESC
    `,
      [userId, limit, userId],
    );

    return NextResponse.json(
      projects.map((project) => {
        try {
          const parsedSettings = JSON.parse(project.settings);
          const parsedCartridge = project.cartridge ? JSON.parse(project.cartridge) : null;

          // Migrate legacy projects (without cartridge) into cartridge shape
          const cartridge = parsedCartridge
            ? parsedCartridge
            : {
                scenes: project.scenes ? JSON.parse(project.scenes) : [],
                characters: project.characters ? JSON.parse(project.characters) : [],
                style: project.style ? JSON.parse(project.style) : { sref: '', prompt: '' },
              };

          return {
            ...project,
            settings: parsedSettings,
            cartridge,
            totalLines: project.totalLines || 0,
            totalLikes: project.totalLikes || 0,
          };
        } catch (parseError) {
          console.error('JSON parsing error for project', project.id, ':', parseError);
          return {
            ...project,
            settings: {},
            cartridge: {
              scenes: [],
              characters: [],
              style: { sref: '', prompt: '' },
            },
            totalLines: project.totalLines || 0,
            totalLikes: project.totalLikes || 0,
            _parseError: true,
          };
        }
      }),
    );
  } catch (error) {
    console.error('Error fetching recently played projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
