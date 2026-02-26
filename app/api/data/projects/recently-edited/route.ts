import { getLocalUser } from '@/app/api/shared/local-user';
import { getDatabase } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/recently-edited - Get recently edited projects
export async function GET(request: NextRequest) {
  try {
    const user = getLocalUser();
    const userId = user.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const db = await getDatabase();

    const projects = await db.all(
      `
      SELECT 
        p.*,
        COALESCE(SUM(CASE WHEN pl.lines IS NOT NULL THEN json_array_length(pl.lines) ELSE 0 END), 0) as totalLines,
        COUNT(DISTINCT prl.id) as totalLikes,
        u.displayName as userDisplayName
      FROM projects p
      LEFT JOIN playthroughs pl ON p.id = pl.projectId
      LEFT JOIN projectlikes prl ON p.id = prl.projectId
      LEFT JOIN users u ON p.userId = u.userId
      WHERE p.userId = ?
      GROUP BY p.id
      ORDER BY p.updatedAt DESC 
      LIMIT ?
    `,
      [userId, limit],
    );

    return NextResponse.json(
      projects.map((project) => {
        try {
          const parsedSettings = JSON.parse(project.settings);
          const parsedCartridge = project.cartridge ? JSON.parse(project.cartridge) : null;
          // Migrate old format to cartridge format if needed
          let cartridge;
          if (parsedCartridge) {
            cartridge = parsedCartridge;
          } else {
            // Legacy project - migrate to cartridge format
            cartridge = {
              scenes: project.scenes ? JSON.parse(project.scenes) : [],
              characters: project.characters ? JSON.parse(project.characters) : [],
              style: project.style ? JSON.parse(project.style) : { sref: '', prompt: '' },
            };
          }

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
    console.error('Error fetching recently edited projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
