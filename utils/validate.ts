import { Cartridge, EditableProject, END_SCENE_ID, Scene } from '@/app/types';
import { DragEvent } from 'react';
import { getScene } from './game';

/**
 * Normalizes a trigger UUID to the correct format: tr-{sceneId}-{triggerId}
 */
function normalizeTriggerUuid(triggerId: string, sceneUuid: string): string {
  // Defensive check for undefined/null triggerId
  if (!triggerId || typeof triggerId !== 'string') {
    console.error('normalizeTriggerUuid received invalid triggerId:', triggerId);
    // Generate a fallback UUID
    const sceneBase = sceneUuid.replace(/^sc-/, '');
    return `tr-${sceneBase}-${Date.now()}`;
  }

  // Extract scene base ID (remove 'sc-' prefix if present)
  const sceneBase = sceneUuid.replace(/^sc-/, '');

  // If already in correct format (tr-{sceneBase}-{suffix}), return as is
  if (triggerId.startsWith(`tr-${sceneBase}-`)) {
    return triggerId;
  }

  // Handle special fallback trigger
  if (triggerId === 'trigger-fallback') {
    return `tr-${sceneBase}-fallback`;
  }

  // Handle trigger-N format (e.g., trigger-1, trigger-2)
  if (triggerId.startsWith('trigger-')) {
    const triggerNum = triggerId.replace('trigger-', '');
    return `tr-${sceneBase}-${triggerNum}`;
  }

  // Handle tr-N-suffix format (wrong scene ID)
  if (triggerId.startsWith('tr-')) {
    // Extract just the suffix after the second dash
    const parts = triggerId.split('-');
    if (parts.length >= 3) {
      // Join everything after the first two parts (tr-oldSceneId)
      const suffix = parts.slice(2).join('-');
      return `tr-${sceneBase}-${suffix}`;
    }
  }

  // Handle plain numbers or other formats
  // Just append to scene base
  const cleanId = triggerId.replace(/^tr-/, '');
  return `tr-${sceneBase}-${cleanId}`;
}

/**
 * Sanitizes a cartridge by fixing common issues from AI generation
 * - Normalizes trigger UUIDs to correct format
 * - Removes invalid place references from scenes
 * - Removes invalid character references from scenes
 * - Fixes invalid trigger references
 */
export const sanitizeCartridge = (cartridge: Cartridge): Cartridge => {
  const { scenes, characters, places } = cartridge;

  // Build sets of valid IDs
  const characterUuidSet = new Set(characters.map((c) => c.uuid));
  const placeUuidSet = new Set((places || []).map((p) => p.uuid));
  const sceneUuidSet = new Set(scenes.map((s) => s.uuid));

  // Sanitize scenes
  const sanitizedScenes: Scene[] = scenes.map((scene) => {
    const sanitizedScene = { ...scene };

    // Remove invalid characterIds
    sanitizedScene.characterIds = scene.characterIds.filter((charId) =>
      characterUuidSet.has(charId),
    );

    // Remove invalid placeId
    if (sanitizedScene.placeId && !placeUuidSet.has(sanitizedScene.placeId)) {
      console.warn(
        `Scene "${scene.title}" (${scene.uuid}) references non-existent place ${sanitizedScene.placeId}. Removing reference.`,
      );
      sanitizedScene.placeId = undefined;
    }

    // Sanitize script character references
    if (sanitizedScene.script) {
      sanitizedScene.script = sanitizedScene.script.map((line) => {
        if (line.type === 'character' && line.characterId) {
          if (!characterUuidSet.has(line.characterId)) {
            console.warn(
              `Script line in scene "${scene.title}" references non-existent character ${line.characterId}. Keeping line but it may cause issues.`,
            );
          }
        }
        return line;
      });
    }

    // Sanitize triggers - normalize UUIDs and fix references
    if (sanitizedScene.triggers) {
      sanitizedScene.triggers = sanitizedScene.triggers
        .filter((trigger) => {
          // Filter out triggers with missing or invalid uuids
          if (!trigger.uuid || typeof trigger.uuid !== 'string') {
            console.warn(
              `Removing trigger with invalid uuid in scene "${scene.title}":`,
              trigger,
            );
            return false;
          }
          return true;
        })
        .map((trigger) => {
          const sanitizedTrigger = { ...trigger };

          // Normalize trigger UUID to correct format
          const originalUuid = trigger.uuid;
          const normalizedUuid = normalizeTriggerUuid(originalUuid, scene.uuid);

          if (originalUuid !== normalizedUuid) {
            console.warn(
              `Normalizing trigger UUID in scene "${scene.title}": ${originalUuid} -> ${normalizedUuid}`,
            );
            sanitizedTrigger.uuid = normalizedUuid;
          }

          // Fix invalid goToSceneId
          if (
            sanitizedTrigger.goToSceneId &&
            sanitizedTrigger.goToSceneId !== END_SCENE_ID &&
            !sceneUuidSet.has(sanitizedTrigger.goToSceneId)
          ) {
            console.warn(
              `Trigger in scene "${scene.title}" references non-existent scene ${sanitizedTrigger.goToSceneId}. Setting to END.`,
            );
            sanitizedTrigger.goToSceneId = END_SCENE_ID;
          }

          return sanitizedTrigger;
        });
    }

    return sanitizedScene;
  });

  return {
    ...cartridge,
    scenes: sanitizedScenes,
  };
};

export const validate = (data: EditableProject): string | null => {
  if (typeof data !== 'object' || data === null) {
    return 'Config must be an object';
  }

  const validationError = validateCartridge(data.cartridge);
  if (validationError) {
    return validationError;
  }

  // Validate that settings.playerId references a real character uuid
  const playerId = data.settings?.playerId;
  if (!playerId) {
    return 'Settings must include a valid playerId (character uuid)';
  }
  const characterUuids = new Set(data.cartridge.characters.map((c) => c.uuid));
  if (!characterUuids.has(playerId)) {
    return `playerId ${playerId} does not refer to a valid character`;
  }

  // Validate startingSceneId
  const startingSceneId = data.settings?.startingSceneId;
  if (!startingSceneId) {
    return 'Settings must include a valid startingSceneId (scene uuid)';
  }
  const sceneUuids = new Set(data.cartridge.scenes.map((s) => s.uuid));
  if (!sceneUuids.has(startingSceneId)) {
    return `startingSceneId ${startingSceneId} does not refer to a valid scene`;
  }

  return null;
};

export const validateCartridge = (cartridge: Cartridge): string | null => {
  const { scenes, characters, places } = cartridge;

  // Validate scenes
  if (!Array.isArray(scenes)) {
    return 'Scenes must be an array';
  }

  // Ensure character uuids are unique and valid
  const characterUuidSet = new Set<string>();
  for (const char of characters) {
    if (typeof char.uuid !== 'string' || char.uuid.trim() === '') {
      return 'Character uuid must be a non-empty string';
    }
    if (characterUuidSet.has(char.uuid)) {
      return `Duplicate character uuid detected: ${char.uuid}`;
    }
    characterUuidSet.add(char.uuid);
  }

  // Build place uuid set for validation
  const placeUuidSet = new Set<string>();
  if (places && Array.isArray(places)) {
    for (const place of places) {
      if (typeof place.uuid !== 'string' || place.uuid.trim() === '') {
        return 'Place uuid must be a non-empty string';
      }
      if (placeUuidSet.has(place.uuid)) {
        return `Duplicate place uuid detected: ${place.uuid}`;
      }
      placeUuidSet.add(place.uuid);
    }
  }

  const sceneUuidSet = new Set<string>();
  for (const scene of scenes) {
    if (typeof scene.uuid !== 'string' || scene.uuid.trim() === '') {
      return 'Scene uuid must be a non-empty string';
    }
    if (sceneUuidSet.has(scene.uuid)) {
      return `Duplicate scene uuid detected: ${scene.uuid}`;
    }
    sceneUuidSet.add(scene.uuid);

    if (scene.imageUrl && typeof scene.imageUrl !== 'string') {
      return 'Scene image URL must be a string';
    }
    if (!Array.isArray(scene.script)) {
      return 'Scene script must be an array';
    }
    for (const line of scene.script) {
      if (typeof line.text !== 'string') {
        return 'Scene script line text must be a string';
      }
    }
    if (!Array.isArray(scene.characterIds)) {
      return 'Scene characterIds must be an array';
    }
    if (!Array.isArray(scene.triggers)) {
      return 'Scene triggers must be an array';
    }

    // Check if characterIds refer to valid characters
    for (const charId of scene.characterIds) {
      if (typeof charId !== 'string') {
        return 'Character IDs must be strings (uuids)';
      }
      if (!characterUuidSet.has(charId)) {
        return `Character ID ${charId} in scene ${scene.title} does not refer to a valid character`;
      }
    }

    // Check if placeId refers to a valid place
    if (scene.placeId && !placeUuidSet.has(scene.placeId)) {
      return `Place ID ${scene.placeId} in scene ${scene.title} does not refer to a valid place`;
    }

    // Validate triggers
    const triggerUuidSet = new Set<string>();
    for (const trigger of scene.triggers) {
      if (typeof trigger.uuid !== 'string' || trigger.uuid.trim() === '') {
        return 'Trigger uuid must be a non-empty string';
      }
      if (triggerUuidSet.has(trigger.uuid)) {
        return `Duplicate trigger uuid detected in scene ${scene.title}: ${trigger.uuid}`;
      }
      triggerUuidSet.add(trigger.uuid);

      if (trigger.type === 'action') {
        if (typeof trigger.condition !== 'string') {
          return 'Trigger condition must be a string';
        }
        if (
          trigger.dependsOnTriggerIds &&
          !trigger.dependsOnTriggerIds.every((id) => typeof id === 'string')
        ) {
          return 'dependsOnTriggerIds must be an array of trigger uuids (strings)';
        }
        if (trigger.dependsOnTriggerIds) {
          trigger.dependsOnTriggerIds.forEach((id) => {
            if (!triggerUuidSet.has(id)) {
              return `A dependsOnTriggerId in scene ${scene.title} does not refer to a valid trigger in the same scene: ${id}`;
            }
          });
        }
      }
      if (typeof trigger.narrative !== 'string') {
        return 'Trigger narrative must be a string';
      }
      if (trigger.goToSceneId && trigger.goToSceneId !== END_SCENE_ID) {
        try {
          getScene({ cartridge: { scenes } }, trigger.goToSceneId!);
        } catch (error) {
          return `goToSceneId ${trigger.goToSceneId} does not refer to a valid scene`;
        }
      }
    }
  }

  // Validate characters
  if (!Array.isArray(characters)) {
    return 'Characters must be an array';
  }

  // Check character objects
  for (const char of characters) {
    if (typeof char.description !== 'string') {
      return 'Character description must be a string';
    }
    if (typeof char.sprites !== 'object') {
      return 'Character sprites must be an object';
    }
  }

  // Ensure at least one character is playable (the first one)
  if (characters.length === 0) {
    return 'At least one character must exist for player to play as.';
  }

  return null;
};

export const validateImageUrl = (e: DragEvent<HTMLDivElement>): string => {
  try {
    const url = e.dataTransfer.getData('text/plain');
    const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4'];
    const urlObject = new URL(url);

    const extension = urlObject.pathname.split('.').pop()?.toLowerCase();

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Please provide a valid image URL (http or https).');
    }

    if (!extension || !extensions.includes(extension)) {
      throw new Error(
        'Please use an image URL with a .png, .jpg, .jpeg, .gif, .webp, or .mp4 extension.',
      );
    }

    return url;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Invalid image URL');
  }
};
