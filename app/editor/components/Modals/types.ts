import { Character, Place, Project, Scene, Trigger, User } from '@/app/types';
import { EntityType } from '../../utils/entity';

export type ConfirmModalData = {
  title: string;
  message: string;
  onConfirm: () => void;
};

export type CharacterNameConfirmModalData = {
  oldName: string;
  newName: string;
  onConfirmRename: () => void;
  onConfirmNoRename: () => void;
};

export type EditCharacterModalData = {
  uuid: string;
  characterData: Character;
};

export type CreateCharacterModalData = {
  characterData?: Character;
};

export type EditPlaceModalData = {
  uuid: string;
  placeData: Place;
};

export type CreatePlaceModalData = {
  placeData?: Place;
};

export type ConfigModalData = {
  tab?: 'export' | 'settings';
};

export type TriggerModalData = {
  sceneId: number;
  triggerId?: number;
  triggerData?: Trigger;
};

type Entity = Character | Scene | Trigger | Project | User;

export type ImageSelectModalData = {
  type: EntityType;
  entity: Entity;
  updateEntity: (updates: Record<string, string>) => void;
};

export type CutoutModalData = {
  character: Character;
};

export type SharingModalData = Record<string, never>;

export type CreateScriptLineModalData = {
  sceneUuid: string;
};

export type ModalRegistry = {
  editCharacter: EditCharacterModalData;
  createCharacter: CreateCharacterModalData;
  editPlace: EditPlaceModalData;
  createPlace: CreatePlaceModalData;
  config: ConfigModalData;
  selectImage: ImageSelectModalData;
  sharing: SharingModalData;
  createScriptLine: CreateScriptLineModalData;
};

export type ModalStackEntry = {
  modal: keyof ModalRegistry;
  data?: ModalRegistry[keyof ModalRegistry];
};
