import { suggestedGenres } from '../constants';
import { Project } from '../types';

export type FeaturedProject = Project & {
  thumbnailImageUrl: string;
  previewVideoUrl?: string;
};

function sortByPopularity(projects: Project[]): Project[] {
  return projects.sort((a, b) => (b.totalLines || 0) - (a.totalLines || 0));
}

export function sortProjects(projects: Project[]): {
  byGenre: Record<string, Project[]>;
  byRecency: Project[];
} {
  const byGenre: Record<string, Project[]> = {};

  // Initialize all genres from suggestedGenres
  for (const genre of suggestedGenres) {
    byGenre[genre] = [];
  }

  for (const project of projects) {
    if (project.settings.genre) {
      byGenre[project.settings.genre] = byGenre[project.settings.genre] || [];
      byGenre[project.settings.genre].push(project);
    }
  }

  for (const genre of Object.keys(byGenre)) {
    byGenre[genre] = sortByPopularity(byGenre[genre]);
  }

  const byRecency = projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return {
    byGenre,
    byRecency,
  };
}
