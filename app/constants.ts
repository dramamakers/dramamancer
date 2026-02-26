import { getStartingScene } from '@/utils/game';
import { Language } from '@/utils/hooks/useLocalTranslator';
import { getSceneTransitionLines } from '@/utils/lines';
import {
  generateCharacterUuid,
  generatePlaceUuid,
  generateSceneUuid,
  generateTriggerUuid,
} from '@/utils/uuid';
import {
  ActionTrigger,
  Crop,
  DEFAULT_SPRITE_ID,
  END_SCENE_ID,
  FallbackTrigger,
  Playthrough,
  Project,
  Scene,
  Sprite,
} from './types';

export const getActionTrigger = (
  condition: string,
  sceneId: string,
  endingName?: string,
): ActionTrigger => {
  return {
    uuid: generateTriggerUuid(sceneId),
    narrative: '',
    type: 'action',
    condition,
    goToSceneId: endingName ? END_SCENE_ID : undefined,
    endingName,
    dependsOnTriggerIds: [],
  };
};

export const getFallbackTrigger = (
  k: number,
  sceneId: string,
  endingName?: string,
): FallbackTrigger => {
  return {
    uuid: generateTriggerUuid(sceneId),
    narrative: '',
    type: 'fallback',
    k,
    goToSceneId: END_SCENE_ID,
    endingName,
  };
};

export const getBlankScene = (sceneId: string): Scene => {
  return {
    uuid: sceneId,
    title: '',
    placeId: undefined,
    script: [],
    characterIds: [],
    triggers: [getFallbackTrigger(5, sceneId)],
  };
};

export const suggestedStyles = {
  'write in lowercase': 'ONLY use lowercase letters, with brief, short sentences.',
  'everything takes place in a group chat':
    'The entire story is taking place in a long group text. Each character dialogue should be the equivalent of them texting.',
  'write like shakespeare':
    'Write in Early Modern English with thee/thou/thy, flowery metaphors, and iambic pentameter where possible.',
  'write in rhyming verse':
    'Every line should rhyme with the previous line or follow ABAB/AABB rhyme schemes throughout.',
  'alphabetical words':
    'Start every word in each sentence with the next letter of the alphabet, i.e. "Alice bought cats" then "Dan entered forests".',
  'write like a noir detective':
    'Use hard-boiled detective voice with short, punchy sentences and cynical observations about human nature.',
  'write like a fantasy epic':
    'Use elevated, archaic language with lots of world-building details and grandiose descriptions.',
  'write like a childrens book':
    'Write in a way that is appropriate for a childrens book, with simple language and short sentences.',
  'escape room style game':
    'Always present puzzles that require exploration and logical thinking, like an escape room. Before pausing, always suggest specific actions the player can take to gain information. Never spoil the solution.',
  'choose your own adventure game':
    'Before pausing for player input, always present 2-3 suggestions for what to do next, formatted as "Do you: A) B) C)"',
  'improv comedy style':
    'Use "yes, and..." principles where characters build on each other\'s ideas in absurd, comedic ways.',
  'no dialogue allowed':
    'Tell the story entirely through narration and action descriptions with zero spoken words.',
};

export const suggestedGenres = [
  'Action',
  'Adventure',
  'Comedy',
  'Mystery',
  'Fantasy',
  'Historical',
  'Horror',
  'Romance',
  'Puzzle',
  'Sci-Fi',
  'Simulation',
  'RPG',
  'Casual',
  'Thriller',
  'Slice of life',
  'Drama',
];

export const CURRENT_PROJECT_VERSION = 'dramamancer-v1';

export const supportedLanguages: Language[] = [
  'Original',
  'English',
  'Spanish',
  'Portuguese',
  'Italian',
  'French',
  'Indonesian',
  'German',
  'Chinese',
  'Korean',
  'Japanese',
  'Hindi',
  'Bengali',
];

export const getDefaultProject = (userId: string): Project => {
  const startingSceneId = generateSceneUuid();
  const characterId = generateCharacterUuid();
  const placeId = generatePlaceUuid();

  return {
    id: -1,
    userId,
    createdAt: 0,
    title: '',
    cartridge: {
      scenes: [
        {
          uuid: startingSceneId,
          title: 'Scene 1',
          placeId,
          script: [],
          characterIds: [],
          triggers: [
            getActionTrigger('The player does something good', startingSceneId, 'Good End'),
            getFallbackTrigger(5, startingSceneId, 'Bad End'),
          ],
        },
      ],
      characters: [
        {
          uuid: characterId,
          name: 'Someone',
          description: '',
          sprites: { [DEFAULT_SPRITE_ID]: { imageUrl: '' } },
        },
      ],
      places: [
        {
          uuid: placeId,
          name: 'Home',
          description: '',
          sprites: { [DEFAULT_SPRITE_ID]: { imageUrl: '' } },
        },
      ],
      style: {
        prompt: '',
        sref: '',
      },
    },
    version: CURRENT_PROJECT_VERSION,
    settings: {
      shortDescription: '',
      longDescription: '',
      genre: 'Adventure',
      visibility: 'private',
      remixable: true,
      playerId: characterId,
      startingSceneId: startingSceneId,
    },
    updatedAt: 0,
  };
};

export const getDefaultPlaythrough = async (
  project: Project,
  userId: string,
): Promise<Playthrough> => {
  const startingScene = getStartingScene(project);
  return {
    id: -1,
    projectId: -1,
    userId: userId,
    createdAt: 0,
    updatedAt: 0,
    liked: false,
    visibility: 'private',
    lines: await getSceneTransitionLines({
      newScene: startingScene,
    }),
    projectSnapshot: project,
    currentSceneId: startingScene.uuid,
    currentLineIdx: 0,
  };
};

export const DEFAULT_CROP_CONFIG: Crop = {
  scale: 1,
  x: 0,
  y: 0,
};

export const DEFAULT_CUTOUT_CONFIG = {
  scale: 3.5,
  x: 0,
  y: 15,
  flip: false,
};

export const getCroppedSpriteStyle = (sprite: Sprite): React.CSSProperties => {
  return {
    position: 'absolute',
    width: '100%',
    height: '100%',
    minWidth: '100%',
    minHeight: '100%',
    objectFit: 'cover',
    transform: `scale(${sprite.crop?.scale ?? DEFAULT_CROP_CONFIG.scale})`,
    left: `${sprite.crop?.x ?? DEFAULT_CROP_CONFIG.x}%`,
    top: `${sprite.crop?.y ?? DEFAULT_CROP_CONFIG.y}%`,
  };
};

export const HELP_LINK = 'https://elated-howler-139.notion.site/dramamancer';
