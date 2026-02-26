import { DisplayLine } from '@/app/types';

/**
 * Get lines that belong to a specific scene only.
 * Walks backwards from the end to find the most recent scene transition,
 * then returns all lines from that point forward.
 */
export function getSceneLines(allLines: DisplayLine[], sceneId: string): DisplayLine[] {
  if (!allLines || allLines.length === 0) return [];

  // Find the most recent line with a sceneId that matches the target sceneId
  let sceneStartIndex = 0;
  for (let i = allLines.length - 1; i >= 0; i--) {
    const lineSceneId = allLines[i]?.metadata?.sceneId;
    if (lineSceneId === sceneId) {
      sceneStartIndex = i;
      break;
    }
  }

  // Return lines from the scene start to the end
  return allLines.slice(sceneStartIndex);
}

/**
 * Get the scene ID from the latest line in the story.
 * This represents the "latest" scene based on story progression.
 */
export function getLatestSceneId(lines: DisplayLine[]): string | undefined {
  if (!lines || lines.length === 0) return undefined;

  for (let i = lines.length - 1; i >= 0; i--) {
    const sceneId = lines[i]?.metadata?.sceneId;
    if (sceneId) {
      return sceneId;
    }
  }
  return undefined;
}

/**
 * Get the scene ID from the current displayed line.
 * This represents the "current" scene based on player position.
 */
export function getCurrentSceneId(
  lines: DisplayLine[],
  currentLineIdx?: number,
): string | undefined {
  if (!lines || lines.length === 0) return undefined;
  for (let i = currentLineIdx || 0; i >= 0; i--) {
    const sceneId = lines[i]?.metadata?.sceneId;
    if (sceneId) {
      return sceneId;
    }
  }
  return undefined;
}
