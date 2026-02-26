import { extractTriggerIds } from '@/app/editor/utils/entity';
import {
  Character,
  DEFAULT_SPRITE_ID,
  DisplayLine,
  END_SCENE_ID,
  Place,
  Project,
  Scene,
  Sprite,
  Trigger,
} from '@/app/types';
import { getCompletionInfo } from '@/components/Game/utils/completion';
import { formatPercentage, formatSceneTitle } from './format';

export function getCompletionText(playthroughs: any, project: any): string {
  const completionInfo = getCompletionInfo(playthroughs, project);
  const { completionPercentage, reachedEndings, totalEndings } = completionInfo;
  let text = `${totalEndings.length === 0 ? '???' : formatPercentage(completionPercentage)} explored`;
  if (totalEndings.length > 0) {
    text += `, ${reachedEndings.length} of ${totalEndings.length} ending${totalEndings.length > 1 ? 's' : ''} unlocked`;
  } else {
    text += `, ${reachedEndings.length} endings`;
  }
  return text;
}

export function getCast(characters: Character[], scene: Scene): Character[] {
  return scene.characterIds
    .map((c) => characters.find((char) => char.uuid === c))
    .filter((c) => c !== undefined);
}

export function getSceneIndex(project: { cartridge: { scenes: Scene[] } }, sceneId: string) {
  return project.cartridge.scenes.findIndex((scene) => scene.uuid === sceneId);
}

export function getTriggerById(project: Project, triggerId: string) {
  const { sceneId } = extractTriggerIds(triggerId);
  if (!sceneId) {
    throw new Error(`Invalid trigger id: ${triggerId}`);
  }

  const scene = getScene(project, sceneId);
  const trigger = scene.triggers.find((t: Trigger) => {
    return t.uuid === triggerId;
  });
  if (!trigger) {
    throw new Error(`Trigger not found: ${triggerId}`);
  }
  return trigger;
}

export function getCharacter(project: Project, characterId: string) {
  const character = project.cartridge.characters.find(
    (character) => character.uuid === characterId,
  );
  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }
  return character;
}

export function getPlace(project: Project, placeId: string) {
  const place = project.cartridge.places.find((place) => place.uuid === placeId);
  if (!place) {
    throw new Error(`Place not found: ${placeId}`);
  }

  return place;
}

export function getCharacterById(project: Project, characterId: string) {
  const character = project.cartridge.characters.find(
    (character) => character.uuid === characterId,
  );
  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }
  return character;
}

/**
 * Find the best matching character using priority-based matching:
 * 1. Exact match (case-sensitive)
 * 2. Case-insensitive and trimmed match
 * 3. Partial match (character name contains the search term or vice versa)
 */
export function findBestCharacterMatch(
  characters: Character[],
  characterName: string,
): Character | null {
  if (!characterName || !characters.length) {
    return null;
  }

  // Priority 1: Exact match (case-sensitive)
  let match = characters.find((c) => c.name === characterName);
  if (match) return match;

  // Priority 2: Case-insensitive and trimmed match
  const normalizedName = characterName.toLowerCase().trim();
  match = characters.find((c) => c.name.toLowerCase().trim() === normalizedName);
  if (match) return match;

  // Priority 3: Partial match (either direction)
  match = characters.find((c) => {
    const charName = c.name.toLowerCase().trim();
    return charName.includes(normalizedName) || normalizedName.includes(charName);
  });

  return match || null;
}

export function getScene(
  project: {
    cartridge: {
      scenes: Scene[];
    };
  },
  sceneId: string | number,
): Scene {
  if (sceneId === END_SCENE_ID) {
    throw new Error('End scene passed into getScene');
  }

  if (typeof sceneId === 'number') {
    // Legacy numeric scene IDs
    return project.cartridge.scenes[sceneId];
  }

  const scene = project.cartridge.scenes.find((scene) => scene.uuid === sceneId);
  if (!scene) {
    return project.cartridge.scenes[0];
  }
  return scene;
}

export function getSceneTitle(scenes: Scene[], sceneId?: string, endingName?: string): string {
  if (!sceneId) return 'Untitled scene';
  if (sceneId === END_SCENE_ID) {
    return `end${endingName ? `: ${endingName}` : ''}`;
  }

  const sceneIndex = getSceneIndex({ cartridge: { scenes } }, sceneId);
  const scene = scenes[sceneIndex];
  return formatSceneTitle(scene?.title, sceneIndex);
}

export function getStartingScene(project: Project): Scene {
  const startingSceneId = project.settings.startingSceneId;
  const scene = project.cartridge.scenes.find((scene) => scene.uuid === startingSceneId);
  if (!scene) {
    const firstScene = project.cartridge.scenes[0];
    if (!firstScene) {
      throw new Error(`Starting scene not found: ${startingSceneId}`);
    }
    return firstScene;
  }
  return scene;
}

export function getPlayerCharacter(project: Project): Character {
  const playerCharacter = project.cartridge.characters.find(
    (character) => character.uuid === project.settings.playerId,
  );
  if (!playerCharacter) {
    throw new Error(`Player character not found: ${project.settings.playerId}`);
  }
  return playerCharacter;
}

export function getSprite(entity: Character | Place): Sprite {
  const sprite = entity?.sprites?.[DEFAULT_SPRITE_ID];
  if (!sprite) {
    return {
      imageUrl: '',
    };
  }
  return sprite;
}
export function getThumbnailImageUrl(project: Project): string {
  if (project.settings.thumbnailImageUrl) {
    return project.settings.thumbnailImageUrl;
  }

  const scene = getScene(project, project.settings.startingSceneId);
  if (scene.imageUrl && scene.imageUrl !== '') {
    return scene.imageUrl;
  }

  const place = getPlaceById(project, scene.placeId);
  if (place) {
    const sprite = getSprite(place);
    if (sprite.imageUrl && sprite.imageUrl !== '') {
      return sprite.imageUrl;
    }
  }

  return '/placeholder.png';
}

export function getPlaceById(project: Project, placeId?: string): Place | undefined {
  if (!placeId) {
    return undefined;
  }

  const place = project.cartridge.places.find((place) => place.uuid === placeId);
  if (!place) {
    throw new Error(`Place not found: ${placeId}`);
  }

  return place;
}

export function getPlaceName(project: Project, placeId: string) {
  const place = getPlace(project, placeId);
  return place?.name;
}

export function getPlaceSprite(project: Project, placeId?: string): Sprite | undefined {
  if (!placeId) {
    return undefined;
  }
  const place = getPlaceById(project, placeId);
  if (!place) {
    throw new Error(`Place not found: ${placeId}`);
  }
  const sprite = getSprite(place);
  return sprite;
}

export function getScriptLines(project: Project, sceneId: string): DisplayLine[] {
  const scene = getScene(project, sceneId);
  return scene.script.filter((line) => !line.metadata?.verbatim);
}

export function getSceneSprite(project: Project, sceneId: string): Sprite | undefined {
  const scene = getScene(project, sceneId);
  if (!scene) {
    return undefined;
  } else if (scene.imageUrl) {
    return { imageUrl: scene.imageUrl };
  }

  const place = getPlaceById(project, scene.placeId);
  return place ? getSprite(place) : undefined;
}

export function getCharacterImageUrl(character: Character): string | undefined {
  try {
    const sprite = getSprite(character);
    return sprite.imageUrl;
  } catch {
    return undefined;
  }
}
