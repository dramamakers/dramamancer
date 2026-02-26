import { getDatabase } from '@/utils/db';
import { NextResponse } from 'next/server';
import { parseProject } from '../utils';

export async function GET() {
  try {
    const envValue = process.env.FEATURED_PROJECTS;
    const db = await getDatabase();

    const featuredConfigs: Array<{
      projectId: number;
      thumbnailImageUrl?: string;
      previewVideoUrl?: string;
    }> = [];

    try {
      if (envValue) {
        const parsed = JSON.parse(envValue);
        if (Array.isArray(parsed)) {
          featuredConfigs.push(...parsed);
        }
      }
    } catch {
      console.warn('FEATURED_PROJECTS env var is not valid JSON, falling back to public projects');
    }

    // Fetch information about each project id
    const projects = await db.all(
      `SELECT 
        p.id,
        p.title,
        p.settings,
        p.cartridge,
        u.displayName as userDisplayName
      FROM projects p
      LEFT JOIN playthroughs pl ON p.id = pl.projectId
      LEFT JOIN projectlikes prl ON p.id = prl.projectId
      LEFT JOIN users u ON p.userId = u.userId
      WHERE p.id IN (${featuredConfigs.map((config) => config.projectId).join(',')})
      GROUP BY p.id
      ORDER BY p.updatedAt DESC`,
    );

    // Add information about each project to the featured configs
    const parsedProjects = projects.map((p) => parseProject(p));
    parsedProjects.forEach((p) => {
      const pc = featuredConfigs.find((pc) => pc.projectId === p.id);
      if (pc) {
        p.settings.thumbnailImageUrl = pc.thumbnailImageUrl;
        p.previewVideoUrl = pc.previewVideoUrl;
      }
    });

    return NextResponse.json(parsedProjects);
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    return NextResponse.json({ error: 'Failed to fetch featured projects' }, { status: 500 });
  }
}
