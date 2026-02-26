import { Cartridge, Playthrough, Project } from '@/app/types';
import { getPlace, getTriggerById } from './game';

function getSnapshot(project: Project) {
  const { characters, scenes, style } = project.cartridge;
  return {
    scenes: scenes.map((s) => ({
      characters: s.characterIds.map((id) => characters.find((c) => c.uuid === id)),
      title: s.title,
      placeId: s.placeId,
      script: s.script,
      imageUrl: s.imageUrl,
      place: s.placeId ? getPlace(project, s.placeId) : undefined,
    })),
    style: style.prompt,
  };
}

export function isGameOutOfDate(project: Project, playthrough: Playthrough) {
  const projectSnapshot = playthrough?.projectSnapshot;

  // Only sees if project has been changed in visible ways (i.e. characters that aren't in any scenes don't matter)
  const snapshot = getSnapshot(projectSnapshot);
  const current = getSnapshot(project);
  const isOutOfDate = JSON.stringify(snapshot) !== JSON.stringify(current);
  return isOutOfDate;
}

export function isCartridgeOutOfDate(project: Project, cartridge: Cartridge) {
  // Sees if project has been changed in any way
  return JSON.stringify(project.cartridge) !== JSON.stringify(cartridge);
}

/**
 * Check if project updates would make the playthrough outdated.
 * Only returns true if changes affect what the playthrough has already experienced.
 *
 * Checks:
 * 1. Script changes for lines already played in visited scenes
 * 2. Trigger changes that were already activated
 * 3. Character/place changes that were already encountered
 */
export function isPlaythroughOutdatedForEdit(
  updatedProject: Project,
  playthrough: Playthrough,
): boolean {
  if (!playthrough?.projectSnapshot) return false;

  const previousProject = playthrough.projectSnapshot;
  const lines = playthrough.lines;

  // Get playthrough state: visited scenes, activated triggers, played lines per scene
  const visitedSceneIds = new Set<string>();
  const activatedTriggerIds = new Set<string>();
  const sceneLineCount = new Map<string, number>(); // How many lines played in each scene

  lines.forEach((line) => {
    if (line.metadata?.sceneId) {
      visitedSceneIds.add(line.metadata.sceneId);
      sceneLineCount.set(
        line.metadata.sceneId,
        (sceneLineCount.get(line.metadata.sceneId) || 0) + 1,
      );
    }

    if (line.metadata?.activatedTriggerIds) {
      line.metadata.activatedTriggerIds.forEach((id) => activatedTriggerIds.add(id));
    }
  });

  if (playthrough.currentSceneId) {
    visitedSceneIds.add(playthrough.currentSceneId);
  }

  // 2. Check if any activated trigger has changed
  for (const triggerId of activatedTriggerIds) {
    // Find the trigger in both versions
    const prevTrigger = getTriggerById(previousProject, triggerId);
    const updatedTrigger = getTriggerById(updatedProject, triggerId);

    if (JSON.stringify(prevTrigger) !== JSON.stringify(updatedTrigger)) {
      return true;
    }
  }

  // 3. Check if characters/places that were already encountered have changed
  const encounteredCharacterIds = new Set<string>();
  const encounteredPlaceIds = new Set<string>();

  for (const sceneId of visitedSceneIds) {
    const prevScene = previousProject.cartridge.scenes.find((s) => s.uuid === sceneId);
    if (prevScene) {
      prevScene.characterIds?.forEach((id) => encounteredCharacterIds.add(id));
      if (prevScene.placeId) {
        encounteredPlaceIds.add(prevScene.placeId);
      }
    }
  }

  // Check if any encountered characters changed
  for (const charId of encounteredCharacterIds) {
    const prevChar = previousProject.cartridge.characters.find((c) => c.uuid === charId);
    const updatedChar = updatedProject.cartridge.characters.find((c) => c.uuid === charId);

    if (JSON.stringify(prevChar) !== JSON.stringify(updatedChar)) {
      return true;
    }
  }

  // Check if any encountered places changed
  for (const placeId of encounteredPlaceIds) {
    const prevPlace = previousProject.cartridge.places.find((p) => p.uuid === placeId);
    const updatedPlace = updatedProject.cartridge.places.find((p) => p.uuid === placeId);

    if (JSON.stringify(prevPlace) !== JSON.stringify(updatedPlace)) {
      return true;
    }
  }

  return false;
}
