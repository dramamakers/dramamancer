import { Character, DisplayLine, Playthrough, Project, Scene } from '@/app/types';

// Minimal character fixtures
export const mockCharacters: Character[] = [
  {
    name: 'Player',
    description: 'The main character',
    sprites: { default: { imageUrl: 'player.jpg' } },
    uuid: '0',
  },
  {
    name: 'Alice',
    description: 'A friendly character',
    sprites: { default: { imageUrl: 'alice.jpg' } },
    uuid: '1',
  },
  {
    name: 'Bob',
    description: 'A mysterious character',
    sprites: { default: { imageUrl: 'bob.jpg' } },
    uuid: '2',
  },
];

// Minimal scene fixtures
export const mockScenes: Scene[] = [
  {
    uuid: '0',
    title: 'Start',
    script: [
      {
        type: 'narration',
        text: 'You wake up in a peaceful room.',
      },
    ],
    characterIds: ['1'], // Alice
    triggers: [
      {
        type: 'action',
        condition: 'player asks about the door',
        narrative: 'Alice points to a mysterious door.',
        goToSceneId: '1',
        uuid: '0',
      },
      {
        type: 'fallback',
        k: 3,
        narrative: 'Time passes and Alice suggests exploring.',
        goToSceneId: '1',
        uuid: '1',
      },
    ],
  },
  {
    uuid: '1',
    title: 'Corridor',
    script: [
      {
        type: 'narration',
        text: 'You enter a long, dimly lit hallway.',
      },
    ],
    characterIds: ['2'], // Bob
    triggers: [
      {
        type: 'action',
        condition: 'player examines the paintings',
        narrative: 'Bob reveals the secret of the paintings.',
        uuid: '1',
      },
      {
        type: 'action',
        condition: 'player tries to leave',
        narrative: 'Bob blocks the exit.',
        goToSceneId: 'end', // END_SCENE_ID
        uuid: '2',
      },
    ],
  },
];

export const mockProject: Project = {
  id: 1,
  title: 'Test Project',
  settings: {
    shortDescription: 'A test story',
    longDescription: 'A longer test description',
    genre: 'mystery',
    visibility: 'private',
    remixable: false,
    startingSceneId: '0',
    playerId: '0',
  },
  cartridge: {
    scenes: mockScenes,
    characters: mockCharacters,
    places: [],
    style: {
      sref: '--sref https://test-style.com --stylize 750',
      prompt: 'fantasy art style',
    },
  },
  version: 'dramamancer-v1',
  updatedAt: Date.now(),
  userId: 'test-user',
  createdAt: Date.now(),
};

export const mockDisplayLines: DisplayLine[] = [
  {
    type: 'narration',
    text: '', // Scene break lines typically have empty text
    metadata: { sceneId: '0' },
  },
  {
    type: 'narration',
    text: 'You wake up in a peaceful room.',
    metadata: {},
  },
  {
    type: 'character',
    text: 'Welcome! How are you feeling?',
    characterName: 'Alice',
    metadata: {},
  },
  {
    type: 'player',
    text: 'I feel confused.',
    characterName: 'Player',
    metadata: {},
  },
  {
    type: 'character',
    text: "That's normal. Let me help you.",
    characterName: 'Alice',
    metadata: { shouldPause: true },
  },
];

export const mockPlaythrough: Playthrough = {
  id: 1,
  projectId: 1,
  userId: 'test-user',
  lines: mockDisplayLines,
  currentLineIdx: 3,
  updatedAt: Date.now(),
  projectSnapshot: mockProject,
  liked: false,
  visibility: 'private' as const,
  createdAt: Date.now(),
  currentSceneId: '0',
};

// API response mocks
export const mockApiStepResponse = {
  lines: [
    {
      type: 'character' as const,
      text: 'Generated response text',
      characterName: 'Alice',
    },
  ],
  endName: null,
};

export const mockApiCheckTriggersResponse = [0]; // First trigger activated

export const mockApiHintResponse = {
  lines: [
    {
      type: 'narration' as const,
      text: 'Hint: Try asking about the door.',
      metadata: { language: 'en' },
    },
  ],
};

export const mockApiCgResponse = {
  fullPrompt: 'A mysterious door in a peaceful room',
};

// This file contains test fixtures and is not a test file
// Adding a dummy test to prevent Jest from complaining
describe.skip('fixtures', () => {
  it('should export test fixtures', () => {
    expect(mockProject).toBeDefined();
  });
});
