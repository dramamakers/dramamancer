// === MUTATION HELPERS ===
// These helpers take IDs and handle index computation internally

import {
  Character,
  DEFAULT_SPRITE_ID,
  END_SCENE_ID,
  Place,
  Project,
  Scene,
  Trigger,
} from '@/app/types';
import { getSceneIndex } from '@/utils/game';
import { generateTriggerUuid } from '@/utils/uuid';

function getCharacterIndex(project: Project, characterId: string) {
  return project.cartridge.characters.findIndex((character) => character.uuid === characterId);
}

function getPlaceIndex(project: Project, placeId: string) {
  return project.cartridge.places.findIndex((place) => place.uuid === placeId);
}

export function updateSceneById(draft: Project, sceneId: string, updates: Partial<Scene>) {
  const sceneIndex = getSceneIndex(draft, sceneId);
  if (sceneIndex === -1) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  draft.cartridge.scenes[sceneIndex] = { ...draft.cartridge.scenes[sceneIndex], ...updates };
}

export function updateCharacterById(
  draft: Project,
  characterId: string,
  updates: Partial<Character>,
) {
  const characterIndex = getCharacterIndex(draft, characterId);
  if (characterIndex === -1) {
    throw new Error(`Character not found: ${characterId}`);
  }
  draft.cartridge.characters[characterIndex] = {
    ...draft.cartridge.characters[characterIndex],
    ...updates,
  };
}

export function updateTriggerById(
  draft: Project,
  sceneId: string,
  triggerId: string,
  updates: Partial<Trigger>,
) {
  const sceneIndex = getSceneIndex(draft, sceneId);
  if (sceneIndex === -1) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  const triggerIndex = draft.cartridge.scenes[sceneIndex].triggers.findIndex(
    (t: Trigger) => t.uuid === triggerId,
  );
  if (triggerIndex === -1) {
    throw new Error(`Trigger not found: ${triggerId}`);
  }
  draft.cartridge.scenes[sceneIndex].triggers[triggerIndex] = {
    ...draft.cartridge.scenes[sceneIndex].triggers[triggerIndex],
    ...updates,
  } as Trigger;
}

export function deleteSceneById(draft: Project, sceneId: string) {
  const sceneIndex = getSceneIndex(draft, sceneId);
  if (sceneIndex === -1) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  draft.cartridge.scenes.splice(sceneIndex, 1);

  // Check if scene id is referenced in any other scene
  draft.cartridge.scenes.forEach((scene) => {
    if (scene.triggers.some((t) => t.goToSceneId === sceneId)) {
      scene.triggers.forEach((t) => {
        if (t.goToSceneId === sceneId) {
          t.goToSceneId = END_SCENE_ID;
        }
      });
    }
  });
}

export function deleteTriggerById(draft: Project, sceneId: string, triggerId: string) {
  const sceneIndex = getSceneIndex(draft, sceneId);
  if (sceneIndex === -1) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  const triggerIndex = draft.cartridge.scenes[sceneIndex].triggers.findIndex(
    (t: Trigger) => t.uuid === triggerId,
  );
  if (triggerIndex === -1) {
    throw new Error(`Trigger not found: ${triggerId}`);
  }
  draft.cartridge.scenes[sceneIndex].triggers.splice(triggerIndex, 1);

  // Check if trigger id is referenced in any other trigger
  draft.cartridge.scenes.forEach((scene) => {
    const actionTriggers = scene.triggers.filter((t) => t.type === 'action');
    if (actionTriggers.some((t) => t.dependsOnTriggerIds?.includes(triggerId))) {
      actionTriggers.forEach((t) => {
        if (t.dependsOnTriggerIds?.includes(triggerId)) {
          t.dependsOnTriggerIds = t.dependsOnTriggerIds?.filter((id) => id !== triggerId);
          // Set to undefined if empty
          if (t.dependsOnTriggerIds?.length === 0) {
            t.dependsOnTriggerIds = undefined;
          }
        }
      });
    }
  });
}

export function addTriggerToScene(draft: Project, sceneId: string, trigger: Trigger) {
  const sceneIndex = getSceneIndex(draft, sceneId);
  if (sceneIndex === -1) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  draft.cartridge.scenes[sceneIndex].triggers.push(trigger);
}

export function duplicateTriggerById(draft: Project, sceneId: string, triggerId: string) {
  const sceneIndex = getSceneIndex(draft, sceneId);
  if (sceneIndex === -1) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  const triggerIndex = draft.cartridge.scenes[sceneIndex].triggers.findIndex(
    (t: Trigger) => t.uuid === triggerId,
  );
  if (triggerIndex === -1) {
    throw new Error(`Trigger not found: ${triggerId}`);
  }
  const originalTrigger = draft.cartridge.scenes[sceneIndex].triggers[triggerIndex];
  const duplicatedTrigger: Trigger = {
    ...originalTrigger,
    uuid: generateTriggerUuid(sceneId),
  } as Trigger;
  draft.cartridge.scenes[sceneIndex].triggers.splice(triggerIndex + 1, 0, duplicatedTrigger);
}

export function deleteCharacterById(draft: Project, characterId: string) {
  const characterIndex = getCharacterIndex(draft, characterId);
  if (characterIndex === -1) {
    throw new Error(`Character not found: ${characterId}`);
  }

  // Clean up all references to this character
  draft.cartridge.scenes.forEach((scene) => {
    // Remove from scene cast
    if (scene.characterIds.includes(characterId)) {
      scene.characterIds = scene.characterIds.filter((id) => id !== characterId);
    }

    // Clean up script lines that reference this character
    if (scene.script) {
      scene.script = scene.script.map((line) => {
        if (line.characterId === characterId) {
          // Convert character lines to narration when character is deleted
          return {
            ...line,
            type: 'narration' as const,
            characterId: undefined,
            characterName: undefined,
          };
        }
        return line;
      });
    }
  });

  draft.cartridge.characters.splice(characterIndex, 1);
}

export function updatePlaceById(draft: Project, placeId: string, updates: Partial<Place>) {
  const placeIndex = getPlaceIndex(draft, placeId);
  if (placeIndex === -1) {
    throw new Error(`Place not found: ${placeId}`);
  }
  draft.cartridge.places[placeIndex] = {
    ...draft.cartridge.places[placeIndex],
    ...updates,
  };
}

export function deletePlaceById(draft: Project, placeId: string) {
  const placeIndex = getPlaceIndex(draft, placeId);
  if (placeIndex === -1) {
    throw new Error(`Place not found: ${placeId}`);
  }

  // Check if place is referenced in any other scene
  draft.cartridge.scenes.forEach((scene) => {
    if (scene.placeId === placeId) {
      scene.placeId = undefined;
    }
  });

  draft.cartridge.places.splice(placeIndex, 1);
}

// Legacy function for backward compatibility
export function hasTriggersChangedForScene(
  previousProject: Project,
  newProject: Project,
  sceneId: string,
): boolean {
  const prevSceneIndex = getSceneIndex(previousProject, sceneId);
  const newSceneIndex = getSceneIndex(newProject, sceneId);

  // If scene doesn't exist in either version, no trigger changes
  if (prevSceneIndex === -1 || newSceneIndex === -1) {
    return false;
  }

  const prevTriggers = previousProject.cartridge.scenes[prevSceneIndex].triggers;
  const newTriggers = newProject.cartridge.scenes[newSceneIndex].triggers;

  // Different number of triggers = change
  if (prevTriggers.length !== newTriggers.length) {
    return true;
  }

  // Check if any trigger has changed (comparing serialized form for deep equality)
  for (let i = 0; i < prevTriggers.length; i++) {
    if (JSON.stringify(prevTriggers[i]) !== JSON.stringify(newTriggers[i])) {
      return true;
    }
  }

  return false;
}

export function updateCharacterCutout(draft: Project, characterId: string, cutoutImageUrl: string) {
  const characterIndex = getCharacterIndex(draft, characterId);
  if (characterIndex === -1) {
    throw new Error(`Character not found: ${characterId}`);
  }

  const character = draft.cartridge.characters[characterIndex];
  for (const [key, sprite] of Object.entries(character.sprites)) {
    if (key === DEFAULT_SPRITE_ID) {
      sprite.cutout = {
        imageUrl: cutoutImageUrl,
      };
    }
  }
}
