import { extractTriggerIds } from '@/app/editor/utils/entity';
import { Cartridge, Character, Place, Scene, Trigger } from '@/app/types';
import { getSceneIndex } from '@/utils/game';
import {
  generateCharacterUuid,
  generatePlaceUuid,
  generateSceneUuid,
  generateTriggerUuid,
} from '@/utils/uuid';
import { sanitizeCartridge } from '@/utils/validate';
import { CreateTriggerInstruction, Instruction } from './route';

/**
 * Applies an array of instructions to a cartridge, returning a new cartridge.
 * Uses utility functions from game.ts to safely find entities by UUID.
 * Preserves QuickstartCartridge type if input is a QuickstartCartridge.
 */
export function applyInstructions<T extends Cartridge>(
  cartridge: T,
  instructions: Instruction[],
): T {
  // Create a mutable copy of the cartridge
  let result: T = {
    ...cartridge,
    scenes: [...cartridge.scenes],
    characters: [...cartridge.characters],
    places: [...cartridge.places],
    style: { ...cartridge.style },
  } as T;

  for (const instruction of instructions) {
    result = applyInstruction(result, instruction);
  }

  // Sanitize the final cartridge to fix any trigger UUID issues
  return sanitizeCartridge(result) as T;
}

function applyInstruction<T extends Cartridge>(cartridge: T, instruction: Instruction): T {
  switch (instruction.type) {
    case 'create':
      return applyCreate(cartridge, instruction);
    case 'edit':
      return applyEdit(cartridge, instruction);
    case 'delete':
      return applyDelete(cartridge, instruction);
    default:
      throw new Error(`Unknown instruction type: ${(instruction as Instruction).type}`);
  }
}

function applyCreate<T extends Cartridge>(
  cartridge: T,
  instruction: Extract<Instruction, { type: 'create' }>,
): T {
  const { entity, body } = instruction;

  switch (entity) {
    case 'Scene': {
      const sceneUuid = generateSceneUuid();
      const bodyTyped = body as Partial<Scene>;
      const newScene: Scene = {
        uuid: sceneUuid,
        title: '',
        ...body,
        // Always ensure these are arrays, never objects
        script: Array.isArray(bodyTyped.script) ? bodyTyped.script : [],
        characterIds: Array.isArray(bodyTyped.characterIds) ? bodyTyped.characterIds : [],
        triggers: Array.isArray(bodyTyped.triggers) ? bodyTyped.triggers : [],
      };
      return {
        ...cartridge,
        scenes: [...cartridge.scenes, newScene],
      };
    }

    case 'Character': {
      const newCharacter: Character = {
        uuid: generateCharacterUuid(),
        name: '',
        description: '',
        sprites: {},
        ...body,
      };
      return {
        ...cartridge,
        characters: [...cartridge.characters, newCharacter],
      };
    }

    case 'Place': {
      const newPlace: Place = {
        uuid: generatePlaceUuid(),
        name: '',
        description: '',
        sprites: {},
        ...body,
      };
      return {
        ...cartridge,
        places: [...cartridge.places, newPlace],
      };
    }

    case 'Trigger': {
      // Trigger creation requires a sceneId in the body
      const sceneId = (body as CreateTriggerInstruction['body']).sceneId;
      if (!sceneId) {
        throw new Error('Trigger creation requires sceneId in body');
      }

      // Find the scene
      const sceneIndex = getSceneIndex({ cartridge: { scenes: cartridge.scenes } }, sceneId);
      if (sceneIndex === -1) {
        throw new Error(`Scene not found: ${sceneId}`);
      }

      const triggerUuid = generateTriggerUuid(sceneId);

      // Set defaults based on trigger type
      const triggerType = (body as CreateTriggerInstruction['body']).type || 'action';
      const baseDefaults = {
        uuid: triggerUuid,
        type: triggerType,
        narrative: '',
      };

      const typeSpecificDefaults =
        triggerType === 'fallback'
          ? { k: 1 } // Default k value for fallback triggers
          : { condition: '' }; // Default condition for action triggers

      const newTrigger: Trigger = {
        ...baseDefaults,
        ...typeSpecificDefaults,
        ...body,
        uuid: triggerUuid, // Always use generated UUID
      } as Trigger;

      // Remove sceneId from the trigger body (it's not part of the Trigger type)
      delete (newTrigger as Partial<CreateTriggerInstruction['body']>).sceneId;

      // Add trigger to the scene
      const updatedScenes = [...cartridge.scenes];
      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        triggers: [...(updatedScenes[sceneIndex].triggers || []), newTrigger],
      };

      return {
        ...cartridge,
        scenes: updatedScenes,
      };
    }

    case 'Settings':
    case 'Style':
      throw new Error(`Create operation not supported for ${entity}`);

    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}

function applyEdit<T extends Cartridge>(
  cartridge: T,
  instruction: Extract<Instruction, { type: 'edit' }>,
): T {
  const { entity, uuid, body } = instruction;

  switch (entity) {
    case 'Scene': {
      const sceneIndex = cartridge.scenes.findIndex((s) => s.uuid === uuid);
      if (sceneIndex === -1) {
        throw new Error(`Scene not found: ${uuid}`);
      }

      const updatedScenes = [...cartridge.scenes];
      const existingScene = updatedScenes[sceneIndex];

      // Build the updated scene, ensuring arrays are properly handled
      const bodyTyped = body as Partial<Scene>;
      const updatedScene: Scene = {
        ...existingScene,
        ...body,
        // Always ensure these are arrays, never objects
        script: Array.isArray(bodyTyped.script) ? bodyTyped.script : existingScene.script || [],
        characterIds: Array.isArray(bodyTyped.characterIds)
          ? bodyTyped.characterIds
          : existingScene.characterIds || [],
        triggers: Array.isArray(bodyTyped.triggers)
          ? bodyTyped.triggers
          : existingScene.triggers || [],
      };
      updatedScenes[sceneIndex] = updatedScene;

      return {
        ...cartridge,
        scenes: updatedScenes,
      };
    }

    case 'Character': {
      const characterIndex = cartridge.characters.findIndex((c) => c.uuid === uuid);
      if (characterIndex === -1) {
        throw new Error(`Character not found: ${uuid}`);
      }

      const updatedCharacters = [...cartridge.characters];
      const existingCharacter = updatedCharacters[characterIndex];

      const updatedCharacter: Character = {
        ...existingCharacter,
        ...body,
        sprites: existingCharacter.sprites ?? {},
      };

      updatedCharacters[characterIndex] = updatedCharacter;

      return {
        ...cartridge,
        characters: updatedCharacters,
      };
    }

    case 'Place': {
      const placeIndex = cartridge.places.findIndex((p) => p.uuid === uuid);
      if (placeIndex === -1) {
        throw new Error(`Place not found: ${uuid}`);
      }

      const updatedPlaces = [...cartridge.places];
      const existingPlace = updatedPlaces[placeIndex];

      const updatedPlace: Place = {
        ...existingPlace,
        ...body,
        sprites: existingPlace.sprites ?? {},
      };

      updatedPlaces[placeIndex] = updatedPlace;

      return {
        ...cartridge,
        places: updatedPlaces,
      };
    }

    case 'Trigger': {
      // Extract scene ID from trigger UUID
      const { sceneId } = extractTriggerIds(uuid);
      const sceneIndex = getSceneIndex({ cartridge: { scenes: cartridge.scenes } }, sceneId);
      if (sceneIndex === -1) {
        throw new Error(`Scene not found for trigger: ${uuid}`);
      }

      const sceneTriggers = cartridge.scenes[sceneIndex].triggers || [];

      // Ensure triggers is an array (defensive check)
      if (!Array.isArray(sceneTriggers)) {
        throw new Error(
          `Scene triggers is not an array for scene: ${sceneId}. Got: ${typeof sceneTriggers}`,
        );
      }

      const trigger = sceneTriggers.find((t) => t.uuid === uuid);
      if (!trigger) {
        throw new Error(`Trigger not found: ${uuid}`);
      }

      const updatedScenes = [...cartridge.scenes];

      // Build updated trigger with defaults based on type
      const updatedType = (body as CreateTriggerInstruction['body']).type || trigger.type;
      let updatedTrigger = {
        ...trigger,
        ...body,
      };

      // Ensure required fields are present based on type
      if (updatedType === 'fallback') {
        // Ensure k exists for fallback triggers
        if (!('k' in updatedTrigger)) {
          updatedTrigger = { ...updatedTrigger, k: 1 };
        }
      } else if (updatedType === 'action') {
        // Ensure condition exists for action triggers
        if (!('condition' in updatedTrigger)) {
          updatedTrigger = { ...updatedTrigger, condition: '' };
        }
      }

      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        triggers: sceneTriggers.map((t) => (t.uuid === uuid ? updatedTrigger : t)) as Trigger[],
      };

      return {
        ...cartridge,
        scenes: updatedScenes,
      };
    }

    case 'Style': {
      return {
        ...cartridge,
        style: {
          ...cartridge.style,
          ...body,
        },
      };
    }

    case 'Settings':
      throw new Error('Settings editing not supported through instructions');

    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}

function applyDelete<T extends Cartridge>(
  cartridge: T,
  instruction: Extract<Instruction, { type: 'delete' }>,
): T {
  const { entity, uuid } = instruction;

  switch (entity) {
    case 'Scene': {
      const sceneIndex = cartridge.scenes.findIndex((s) => s.uuid === uuid);
      if (sceneIndex === -1) {
        throw new Error(`Scene not found: ${uuid}`);
      }

      return {
        ...cartridge,
        scenes: cartridge.scenes.filter((s) => s.uuid !== uuid),
      };
    }

    case 'Character': {
      const characterIndex = cartridge.characters.findIndex((c) => c.uuid === uuid);
      if (characterIndex === -1) {
        throw new Error(`Character not found: ${uuid}`);
      }

      // Also remove character from all scenes
      const updatedScenes = cartridge.scenes.map((scene) => ({
        ...scene,
        characterIds: (scene.characterIds || []).filter((id) => id !== uuid),
      }));

      return {
        ...cartridge,
        characters: cartridge.characters.filter((c) => c.uuid !== uuid),
        scenes: updatedScenes,
      };
    }

    case 'Place': {
      const placeIndex = cartridge.places.findIndex((p) => p.uuid === uuid);
      if (placeIndex === -1) {
        throw new Error(`Place not found: ${uuid}`);
      }

      return {
        ...cartridge,
        places: cartridge.places.filter((p) => p.uuid !== uuid),
      };
    }

    case 'Trigger': {
      const { sceneId } = extractTriggerIds(uuid);
      const sceneIndex = getSceneIndex({ cartridge: { scenes: cartridge.scenes } }, sceneId);
      if (sceneIndex === -1) {
        throw new Error(`Scene not found for trigger: ${uuid}`);
      }

      const updatedScenes = [...cartridge.scenes];
      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        triggers: (updatedScenes[sceneIndex].triggers || []).filter((t) => t.uuid !== uuid),
      };

      return {
        ...cartridge,
        scenes: updatedScenes,
      };
    }

    case 'Settings':
    case 'Style':
      throw new Error(`Delete operation not supported for ${entity}`);

    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}
