import { TriggerManager } from '@/components/Game/hooks/TriggerManager';

export type Visibility = 'public' | 'unlisted' | 'private';

export interface User {
  userId: string;
  name: string;
  displayName: string;
  imageUrl: string | null;
  projects: Project[];
  playthroughs: Playthrough[];
}

export interface Project {
  id: number; // If -1, project is not saved to the database
  title: string;
  settings: Settings;
  cartridge: Cartridge;
  version: string;
  updatedAt: number;
  userId: string;
  userDisplayName?: string;
  previewVideoUrl?: string; // For featured projects
  createdAt: number;
  totalLines?: number;
  totalLikes?: number;
}

export interface Cartridge {
  scenes: Scene[];
  characters: Character[];
  places: Place[];
  style: Style;
}

export interface QuickstartCartridge {
  scenes: Scene[];
  characters: (Character & { imageGenerationPrompt?: string })[];
  places: (Place & { imageGenerationPrompt?: string })[];
  style: Style;
}

export interface Playthrough {
  id: number;
  projectId: number;
  userId: string;
  userDisplayName?: string;
  title?: string;
  lines: DisplayLine[];
  currentLineIdx: number;
  currentSceneId: string;
  projectSnapshot: Project;
  liked: boolean;
  visibility: Visibility;
  updatedAt: number;
  createdAt: number;
  totalLikes?: number;
}

export interface TraceLog {
  id: number;
  timestamp: number;
  userId: string;
  projectId: number;
  action: string;
  context: string;
  sessionId: string;
  createdAt: number;
}

/* Entities */
export const DEFAULT_SPRITE_ID = 'default';

export interface Character {
  uuid: string; // Unique identifier for the character
  name: string;
  description: string;
  sprites: Record<string /* id */, Sprite>;
}

export interface Place {
  uuid: string;
  name: string;
  description: string;
  sprites: Record<string /* id */, Sprite>;
}

export interface Scene {
  uuid: string; // Unique identifier for the scene
  characterIds: string[]; // References to characters in the scene (uuid)
  title: string;
  script: DisplayLine[];
  triggers: Trigger[]; // Triggers specific to this scene
  prompt?: string; // Prompt for the scene
  placeId?: string; // Optional reference to a place (uuid)
  imageUrl?: string;
}

/* Settings */
export interface Settings {
  shortDescription: string;
  longDescription: string;
  genre: string;
  visibility: Visibility;
  remixable: boolean;
  thumbnailImageUrl?: string;
  startingSceneId: string; // References the uuid of the starting scene
  playerId: string; // References the uuid of the player character
}

/* Style */
export interface Style {
  sref: string;
  prompt: string;
}

/* Event Images */
export interface EventImage {
  type: 'image' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  prompt?: string;
  loading?: boolean;
}

/* Triggers */
export const END_SCENE_ID = 'end';

export type TriggerType = 'action' | 'fallback';

export type BaseTrigger = {
  uuid: string; // Unique identifier for the trigger
  type: TriggerType;
  narrative: string; // The narrative that appears when the trigger occurs
  goToSceneId?: string; // The scene to go to after the trigger is used, or END_SCENE_ID for story end
  endingName?: string; // If goToSceneId is END_SCENE_ID, the name of the ending
  eventImageUrl?: string;
};

export type ActionTrigger = BaseTrigger & {
  type: 'action';
  condition: string; // In natural language, what needs to happen for the trigger to occur
  dependsOnTriggerIds?: string[]; // Array of trigger UUIDs that must fire first for this trigger to be available
};

export type FallbackTrigger = BaseTrigger & {
  type: 'fallback';
  k: number;
};

export type Trigger = ActionTrigger | FallbackTrigger;

/* Generation */
export type XmlLine = {
  text: string; // XML format with unextracted <ch> tags
  role: 'user' | 'assistant';
  metadata?: {
    shouldEnd?: boolean; // Set if line is the end of the story
    endingName?: string; // Set if line is the end of the story -- the name of the ending (undefined if unnamed)

    shouldPause?: boolean; // Should the system pause for user input?
    sceneId?: string | null; // Set if line is scene break -- scene going to (null if last scene break)

    plan?: string; // LLM's planning notes for this line (hidden from player)
    activatedTriggerIds?: string[]; // Array of trigger ids that were activated by this user input
  };
};

export type DisplayLineStatus = 'game-over' | 'waiting-on-user' | 'loading';
export type DisplayLineType = 'character' | 'player' | 'narration' | 'hint';

export type DisplayLine = {
  type: DisplayLineType;
  text: string;
  characterId?: string;
  characterName?: string;
  metadata?: {
    /* Same as XML line metadata */
    shouldEnd?: boolean;
    endingName?: string;
    shouldPause?: boolean;
    sceneId?: string | null;
    activatedTriggerIds?: string[];

    /* New metadata for dialog display */
    verbatim?: boolean; // TRUE if not generated
    status?: DisplayLineStatus;
    eventImageUrl?: string;
  };
};

export type ApiLine = {
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
    metadata?: Record<string, object>;
  }>;
};

export type QuickstartImageData = {
  data: string;
  mediaType: string;
  preview: string;
  url?: string;
  fromSuggestionId?: string; // If image came from a suggestion, this is the suggestion id
};

export type QuickstartLine = ApiLine & {
  before?: Cartridge; // Cartridge from before the edit
  after?: Cartridge; // Cartridge from after the edit
  actions?: Array<
    | {
        type: 'button';
        label: string;
        actionKey: string;
      }
    | {
        type: 'image-select';
        image?: QuickstartImageData | null;
        actionKey: string;
      }
    | {
        type: 'idea-button';
        label: string;
        actionKey: string;
        checked?: boolean;
      }
  >;
};

export type EditableProject = Omit<
  Project,
  'id' | 'updatedAt' | 'userId' | 'createdAt' | 'totalLines' | 'totalLikes' | 'version'
>;

export type StoryState = {
  lines: DisplayLine[];
  currentLine: DisplayLine;
  currentScene: Scene; // Scene based on displayed line (currentLineIdx)
  latestScene: Scene; // Scene based on the last line (where generation happens)
  triggerManager: TriggerManager | null; // Always based on latestScene
  currentTriggerManager: TriggerManager | null;
  eventImageUrl: string | null;
  disabledNext: boolean;
  disabledBack: boolean;
  handleNext: () => void;
  handleBack: () => void;
  handleUserInput: (input: string) => Promise<void>;
  handleHintRequest: () => Promise<void>;
  setCurrentLineIdx: (idx: number) => void;
  redoFromLine: () => Promise<void>;
};

/* Sprites */
export enum SpriteDisplay {
  PROFILE = 'profile',
  CUTOUT = 'cutout',
}

export interface Sprite {
  imageUrl: string;
  display?: SpriteDisplay;
  cutout?: Cutout;
  crop?: Crop;
}

export interface Cutout {
  imageUrl: string;
  scale?: number;
  y?: number;
  x?: number;
  flip?: boolean;
}

export interface Crop {
  scale?: number;
  x?: number;
  y?: number;
}
