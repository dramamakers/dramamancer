import { Playthrough, Visibility } from '@/app/types';

export function parsePlaythrough(row: {
  lines: string;
  projectSnapshot: string;
  liked: number | boolean;
  visibility?: string | null;
  totalLikes?: number | null;
  userDisplayName?: string;
  [k: string]: unknown;
}): Playthrough {
  const parsedLines = JSON.parse(row.lines);
  const snapshot = JSON.parse(row.projectSnapshot);

  // Migrate legacy snapshots to ensure cartridge is present
  const cartridge = snapshot.cartridge
    ? snapshot.cartridge
    : {
        scenes: snapshot.scenes || [],
        characters: snapshot.characters || [],
        style: snapshot.style || { sref: '', prompt: '' },
      };

  const migratedSnapshot = {
    ...snapshot,
    cartridge,
  };

  return {
    ...(row as unknown as Playthrough),
    lines: parsedLines,
    projectSnapshot: migratedSnapshot,
    liked: Boolean(row.liked),
    visibility: (row.visibility as Visibility) || 'private',
    totalLikes: row.totalLikes ?? 0,
    userDisplayName: row.userDisplayName,
  };
}
