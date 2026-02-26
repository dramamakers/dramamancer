import { Trigger } from '@/app/types';

export function generateUuid(): string {
  // Generate a short, dashless id consisting of [a-z0-9]
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 16; // ~80 bits of entropy if uniformly random

  // Web crypto
  const anyGlobal = globalThis as unknown as {
    crypto?: { getRandomValues?: (array: Uint8Array) => Uint8Array };
  };
  if (typeof anyGlobal !== 'undefined' && anyGlobal?.crypto?.getRandomValues) {
    const bytes = new Uint8Array(length);
    anyGlobal.crypto.getRandomValues(bytes);
    let id = '';
    for (let i = 0; i < bytes.length; i++) {
      id += alphabet[bytes[i] % alphabet.length];
    }
    return id;
  }

  try {
    // Node.js crypto fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    const bytes: Buffer = nodeCrypto.randomBytes(length);
    let id = '';
    for (let i = 0; i < bytes.length; i++) {
      id += alphabet[bytes[i] % alphabet.length];
    }
    return id;
  } catch {
    // ignore and fallback below
  }

  // Last-resort fallback
  let id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
  if (id.length < length) {
    id = (id + Math.random().toString(36).slice(2)).slice(0, length);
  } else if (id.length > length) {
    id = id.slice(0, length);
  }
  return id;
}

export const UUID_PREFIX = {
  character: 'ch-',
  scene: 'sc-',
  trigger: 'tr-',
  place: 'pl-',
} as const;

export function stripKnownPrefix(id: string): string {
  return id.replace(/^(ch\-|sc\-|tr\-|pl\-)/, '');
}

export function ensureCharacterUuid(id: string): string {
  const base = stripKnownPrefix(id);
  return `${UUID_PREFIX.character}${base}`;
}

export function ensureSceneUuid(id: string): string {
  const base = stripKnownPrefix(id);
  return `${UUID_PREFIX.scene}${base}`;
}

export function ensureTriggerUuid(id: string, sceneId: string): string {
  const base = stripKnownPrefix(id);
  const sceneBase = stripKnownPrefix(sceneId);
  return `${UUID_PREFIX.trigger}${sceneBase}-${base}`;
}

export function ensurePlaceUuid(id: string): string {
  const base = stripKnownPrefix(id);
  return `${UUID_PREFIX.place}${base}`;
}

export function generateCharacterUuid(): string {
  return ensureCharacterUuid(generateUuid());
}

export function generateSceneUuid(): string {
  return ensureSceneUuid(generateUuid());
}

export function generateTriggerUuid(sceneId: string): string {
  if (!sceneId) {
    throw new Error('Scene ID is required to generate a trigger UUID');
  }
  return ensureTriggerUuid(generateUuid(), sceneId);
}

export function generatePlaceUuid(): string {
  return ensurePlaceUuid(generateUuid());
}

export function getTriggerId(trigger: Trigger, index: number) {
  // In some older project snapshots, triggers don't have uuids
  if ('uuid' in trigger) {
    return trigger.uuid;
  }
  return `tr-${index}`;
}
