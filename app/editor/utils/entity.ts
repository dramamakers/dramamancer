import { Character, Place, Project, Scene, Trigger, User } from '@/app/types';
import { getSprite, getThumbnailImageUrl } from '@/utils/game';
import { stripKnownPrefix, UUID_PREFIX } from '@/utils/uuid';

export enum EntityType {
  SCENE = 'scene',
  CHARACTER = 'character',
  PLACE = 'place',
  PROJECT = 'project', // thumbnail
  TRIGGER = 'trigger', // event background
  USER = 'user', // profile image
  QUICKSTART = 'quickstart', // quickstart image
}

export type Entity = Character | Place | Scene | Trigger | Project | User;

/* Interal helper functions */
type EntityReference =
  | {
      type: EntityType.CHARACTER;
      id: string;
    }
  | {
      type: EntityType.PLACE;
      id: string;
    }
  | {
      type: EntityType.PROJECT;
    }
  | {
      type: EntityType.SCENE;
      id: string;
    }
  | {
      type: EntityType.TRIGGER;
      sceneId: string;
      triggerId: string;
    };

function extractEntityReference(uuid?: string): EntityReference {
  if (!uuid) {
    return { type: EntityType.PROJECT };
  }

  // Handle special placeholder values (e.g., used in AI-generated cartridges)
  if (uuid === 'trigger-fallback') {
    // Return a valid trigger reference with placeholder IDs
    return { type: EntityType.TRIGGER, sceneId: 'sc-fallback', triggerId: uuid };
  }

  const base = stripKnownPrefix(uuid);

  // A trigger uuid has format: tr-sceneid-triggerid
  if (uuid.startsWith(UUID_PREFIX.trigger)) {
    const parts = base.split('-');
    if (parts.length < 2) {
      throw new Error(`Invalid trigger uuid: ${uuid}`);
    }
    const sceneId = parts[0];
    const triggerId = parts.slice(1).join('-'); // Handle case where trigger ID contains dashes
    if (!sceneId || !triggerId) {
      throw new Error(`Invalid trigger uuid: ${uuid}`);
    }
    return { type: EntityType.TRIGGER, sceneId: `sc-${sceneId}`, triggerId: uuid };
  }

  if (uuid.startsWith(UUID_PREFIX.character)) {
    return { type: EntityType.CHARACTER, id: uuid };
  }

  if (uuid.startsWith(UUID_PREFIX.scene)) {
    return { type: EntityType.SCENE, id: uuid };
  }

  if (uuid.startsWith(UUID_PREFIX.place)) {
    return { type: EntityType.PLACE, id: uuid };
  }

  throw new Error(`Invalid uuid: ${uuid}`);
}

/* Public functions */

export function getEntityTypeByUuid(uuid?: string): EntityType {
  if (!uuid) {
    return EntityType.PROJECT;
  }

  const reference = extractEntityReference(uuid);
  return reference.type;
}

export function getEntityType(entity: Entity): EntityType {
  if (!('uuid' in entity)) {
    return EntityType.PROJECT;
  }

  return getEntityTypeByUuid(entity.uuid);
}

export function getEntityId(entity: Entity): string | undefined {
  if (!('uuid' in entity)) {
    return undefined;
  }

  return entity.uuid;
}

export function getEntityInfo(entity: Entity): { imageUrl: string; type: string } {
  const type = getEntityType(entity);
  if (type === EntityType.CHARACTER) {
    return { imageUrl: getSprite(entity as Character).imageUrl || '/placeholder.png', type };
  }

  if (type === EntityType.SCENE) {
    return { imageUrl: (entity as Scene).imageUrl || '/placeholder.png', type };
  }

  if (type === EntityType.TRIGGER) {
    return { imageUrl: (entity as Trigger).eventImageUrl || '/placeholder.png', type };
  }

  if (type === EntityType.PROJECT) {
    return { imageUrl: getThumbnailImageUrl(entity as Project) || '/placeholder.png', type };
  }

  if (type === EntityType.PLACE) {
    return { imageUrl: getSprite(entity as Place).imageUrl || '/placeholder.png', type };
  }

  if (type === EntityType.USER) {
    return { imageUrl: (entity as User).imageUrl || '/placeholder.png', type };
  }

  return { imageUrl: '/placeholder.png', type };
}

export function extractTriggerIds(uuid?: string): { sceneId: string; triggerId: string } {
  const reference = extractEntityReference(uuid);
  if (reference.type === EntityType.TRIGGER) {
    return {
      sceneId: reference.sceneId,
      triggerId: reference.triggerId,
    };
  }
  throw new Error(`Invalid uuid: ${uuid}`);
}
