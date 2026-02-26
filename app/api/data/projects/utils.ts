/* eslint-disable @typescript-eslint/no-explicit-any */
import { safeJsonParse } from '@/app/api/utils';
import { CURRENT_PROJECT_VERSION, getDefaultProject } from '@/app/constants';
import { Project } from '@/app/types';

export function parseProject(project: any, options: { includeLikeCount?: boolean } = {}): Project {
  const defaultProject = getDefaultProject(project.userId as string);

  try {
    // Parse settings and cartridge with fallbacks
    const parsedSettings = project.settings
      ? safeJsonParse<Project['settings']>(project.settings, 'settings') || defaultProject.settings
      : defaultProject.settings;

    const parsedCartridge = project.cartridge
      ? safeJsonParse<Project['cartridge']>(project.cartridge, 'cartridge') ||
        defaultProject.cartridge
      : defaultProject.cartridge;

    // Handle legacy project format migration
    let cartridge = parsedCartridge;
    if (!parsedCartridge && (project.scenes || project.characters || project.style)) {
      cartridge = {
        scenes: project.scenes ? JSON.parse(project.scenes) : [],
        characters: project.characters ? JSON.parse(project.characters) : [],
        places: [], // Initialize empty places array for legacy projects
        style: project.style ? JSON.parse(project.style) : { sref: '', prompt: '' },
      };
    }

    const parsedProject: Project = {
      id: project.id,
      title: project.title as string,
      updatedAt: project.updatedAt as number,
      userId: project.userId as string,
      userDisplayName: project.userDisplayName as string,
      createdAt: project.createdAt as number,
      cartridge: cartridge,
      settings: parsedSettings,
      version: project.version || CURRENT_PROJECT_VERSION,
      totalLines: project.totalLines || 0,
      totalLikes: project.totalLikes || 0,
    };

    // Include likeCount for backward compatibility if requested
    if (options.includeLikeCount) {
      (parsedProject as any).likeCount = project.likeCount || 0;
    }

    return parsedProject;
  } catch (parseError) {
    console.error('JSON parsing error for project', project.id, ':', parseError);

    // Return project with fallback values on parse error
    const fallbackProject: Project = {
      id: project.id,
      title: project.title as string,
      updatedAt: project.updatedAt as number,
      userId: project.userId as string,
      userDisplayName: project.userDisplayName as string,
      createdAt: project.createdAt as number,
      cartridge: defaultProject.cartridge,
      settings: defaultProject.settings,
      version: project.version || CURRENT_PROJECT_VERSION,
      totalLines: project.totalLines || 0,
      totalLikes: project.totalLikes || 0,
    };

    // Include likeCount for backward compatibility if requested
    if (options.includeLikeCount) {
      (fallbackProject as any).likeCount = 0;
    }

    // Mark as having parse error for debugging
    (fallbackProject as any)._parseError = true;

    return fallbackProject;
  }
}
