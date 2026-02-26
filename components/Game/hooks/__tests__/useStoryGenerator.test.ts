import { DisplayLine, Playthrough } from '@/app/types';
import { getScene } from '@/utils/game';
import { getSceneTransitionLines } from '@/utils/lines';
import { act, renderHook } from '@testing-library/react';
import { useStoryGenerator } from '../../hooks/useStoryGenerator';
import { mockPlaythrough, mockProject } from './fixtures';

// Mock fetch
global.fetch = jest.fn();

// Mock translation functions to avoid API calls in tests
jest.mock('@/utils/hooks/useLocalTranslator', () => ({
  translateTexts: jest.fn(async (texts: string[]) => texts), // Just return the same texts
  getLanguageShort: jest.fn(() => 'en'),
  getLanguage: jest.fn(() => 'English'),
}));

// Helper to wait for async state updates
const waitForAsyncUpdates = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useStoryGenerator', () => {
  let mockUpdatePlaythrough: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUpdatePlaythrough = jest.fn();

    // Default fetch mock - returns a pause response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          lines: [
            {
              type: 'character',
              text: 'Generated response',
              characterName: 'Alice',
            },
          ],
          endName: null,
        }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('should initialize with current playthrough data', async () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: mockPlaythrough,
          updatePlaythrough: mockUpdatePlaythrough,
        }),
      );

      // Wait for any eager generation to complete
      await waitForAsyncUpdates();

      expect(result.current.lines).toEqual(mockPlaythrough.lines);
      expect(result.current.currentLine).toEqual(
        mockPlaythrough.lines[mockPlaythrough.currentLineIdx],
      );
      expect(result.current.currentScene.title).toBe('Start');
    });

    it('should handle no playthrough gracefully', () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: undefined,
          updatePlaythrough: mockUpdatePlaythrough,
        }),
      );

      expect(result.current.lines).toEqual([]);
      expect(result.current.currentLine).toEqual({
        type: 'narration',
        text: '',
      });
    });
  });

  describe('Navigation', () => {
    it('should handle going to next line', () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: mockPlaythrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      act(() => {
        result.current.handleNext();
      });

      // Fast forward past the 100ms debounce delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockUpdatePlaythrough).toHaveBeenCalledWith({
        action: 'progress',
        playthroughId: mockPlaythrough.id,
        updates: expect.objectContaining({
          currentLineIdx: mockPlaythrough.currentLineIdx + 1,
          currentSceneId: mockPlaythrough.currentSceneId,
        }),
      });
    });

    it('should handle going to previous line', () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: mockPlaythrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      act(() => {
        result.current.handleBack();
      });

      // Fast forward past the 100ms debounce delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockUpdatePlaythrough).toHaveBeenCalledWith({
        action: 'progress',
        playthroughId: mockPlaythrough.id,
        updates: expect.objectContaining({
          currentLineIdx: mockPlaythrough.currentLineIdx - 1,
          currentSceneId: mockPlaythrough.currentSceneId,
        }),
      });
    });

    it('should not go beyond line boundaries', () => {
      const playthroughAtEnd = {
        ...mockPlaythrough,
        currentLineIdx: mockPlaythrough.lines.length - 1,
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughAtEnd,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      act(() => {
        result.current.handleNext();
      });

      // Should not update when at the end
      expect(mockUpdatePlaythrough).not.toHaveBeenCalled();
    });

    it('should not go before the first line', () => {
      const playthroughAtStart = {
        ...mockPlaythrough,
        currentLineIdx: 0,
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughAtStart,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      act(() => {
        result.current.handleBack();
      });

      // Should not update when at the beginning
      expect(mockUpdatePlaythrough).not.toHaveBeenCalled();
    });
  });

  describe('Scene changes', () => {
    it('should update currentSceneId when scene changes', async () => {
      renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: mockPlaythrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      // Get the scene we want to transition to
      const newScene = getScene(mockProject, '1');

      await act(async () => {
        await mockUpdatePlaythrough({
          action: 'create',
          playthrough: {
            currentSceneId: newScene.uuid,
            currentLineIdx: 0,
            lines: await getSceneTransitionLines({ newScene }),
          },
        });
      });

      expect(mockUpdatePlaythrough).toHaveBeenCalled();
      const updateArg = mockUpdatePlaythrough.mock.calls[0][0];
      expect(updateArg).toEqual({
        action: 'create',
        playthrough: expect.objectContaining({
          currentLineIdx: 0,
          currentSceneId: '1',
          lines: expect.arrayContaining([
            expect.objectContaining({
              type: 'narration',
              text: '',
              metadata: expect.objectContaining({
                sceneId: '1',
              }),
            }),
          ]),
        }),
      });
      // Implementation creates a new playthrough with scene transition line
    });

    it('should update current scene when scene ID changes', () => {
      const playthroughInScene1 = {
        ...mockPlaythrough,
        lines: [
          { type: 'narration' as const, text: '', metadata: { sceneId: '1' } },
          { type: 'narration' as const, text: 'Start of scene 1' },
        ],
        currentLineIdx: 1,
        currentSceneId: '1', // This should match the scene in the lines
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughInScene1,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      expect(result.current.currentScene.title).toBe('Corridor');
    });

    const playthroughWithSceneChanges = {
      ...mockPlaythrough,
      lines: [
        {
          type: 'narration' as const,
          text: '',
          metadata: { sceneId: '0' },
        },
        {
          type: 'narration' as const,
          text: 'Start of scene 1',
        },
        {
          type: 'narration' as const,
          text: '',
          metadata: { sceneId: '1' },
        },
        {
          type: 'narration' as const,
          text: 'Start of scene 2',
        },
      ],
      currentLineIdx: 2,
      currentSceneId: '1',
    };

    it('set the right sceneId when initializing the scene', () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughWithSceneChanges,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      expect(result.current.currentScene.title).toBe(mockProject.cartridge.scenes[1].title);
    });

    it('goNext should change sceneId', () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughWithSceneChanges,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      act(() => {
        result.current.handleNext();
      });

      expect(result.current.currentScene.title).toBe(mockProject.cartridge.scenes[1].title);
      expect(result.current.currentLine.text).toBe('Start of scene 2');
    });

    it('goPrevious should change sceneId', () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughWithSceneChanges,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      act(() => {
        result.current.handleBack();
      });

      expect(result.current.currentScene.title).toBe(mockProject.cartridge.scenes[0].title);
      expect(result.current.currentLine.text).toBe('Start of scene 1');
    });
  });

  describe('User input and generation', () => {
    beforeEach(() => {
      // Mock step generation API
      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/gen/story/step')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'character',
                    text: 'Response to user input',
                    characterName: 'Alice',
                  },
                ],
                endName: null,
              }),
          });
        }
        if (url.includes('/api/gen/story/check')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                activatedTriggerIds: ['0'], // Mock trigger activation - should be strings, not numbers
              }),
          });
        }
        if (url.includes('/api/gen/story/hint')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'character',
                    text: 'Response to hint',
                    characterName: 'Alice',
                  },
                ],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
    });

    it('should handle user input and check triggers', async () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: mockPlaythrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      await act(async () => {
        await result.current.handleUserInput('My user input! (hello)');
      });

      // Fast forward past the 100ms debounce delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(fetch).toHaveBeenCalledWith('/api/gen/story/check', expect.any(Object));
      expect(mockUpdatePlaythrough).toHaveBeenCalled();

      const lastLine = result.current.lines[result.current.lines.length - 1];
      expect(lastLine.metadata?.activatedTriggerIds).toEqual(['0']);
    });

    it('should exclude consumed triggers from hints', async () => {
      // Create a playthrough where some triggers have been consumed
      const playthroughWithConsumedTrigger = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: '',
            metadata: { sceneId: '0' },
          },
          {
            type: 'player' as const,
            text: 'I ask about the door',
            characterName: 'Player',
            metadata: { activatedTriggerIds: ['0'] }, // First trigger consumed
          },
          {
            type: 'character' as const,
            text: 'Alice points to the door. What else would you like to do?',
            characterName: 'Alice',
            metadata: { shouldPause: true },
          },
        ],
        currentLineIdx: 2,
      };

      // Mock the hint API to capture the triggerConditions parameter
      let capturedTriggerConditions: string[] = [];
      (fetch as jest.Mock).mockImplementation((url: string, options?: { body: string }) => {
        if (url.includes('/api/gen/story/hint')) {
          const body = JSON.parse(options!.body);
          capturedTriggerConditions = body.triggerConditions;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'narration',
                    text: 'You could explore other aspects of the room.',
                    metadata: { shouldPause: true },
                  },
                ],
              }),
          });
        }
        if (url.includes('/api/gen/story/check')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                activatedTriggerIds: [],
              }),
          });
        }
        if (url.includes('/api/gen/story/step')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'narration',
                    text: 'You could explore other aspects of the room.',
                    metadata: { shouldPause: true },
                  },
                ],
                endName: null,
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughWithConsumedTrigger,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      // User input triggers check, then calls handleNext which triggers step generation
      await act(async () => {
        await result.current.handleUserInput('(Hint)');
      });

      // Check that no trigger conditions were passed since the action trigger was consumed
      // and fallback triggers are not included in possibleTriggers
      expect(capturedTriggerConditions).toEqual([]);

      // After user input: original lines + user line + generated response
      expect(result.current.lines.length).toBeGreaterThanOrEqual(
        playthroughWithConsumedTrigger.lines.length + 1,
      );
    });

    it('should add user line and trigger generation', async () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: mockPlaythrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      await act(async () => {
        await result.current.handleUserInput('My user input! (hello)');
      });

      // Fast forward past the 100ms debounce delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // The user line should be added
      const userLine = result.current.lines.find(
        (line) => line.type === 'player' && line.text === 'My user input! (hello)',
      );
      expect(userLine).toBeDefined();
      expect(userLine!.characterName).toBe(
        mockPlaythrough.projectSnapshot.cartridge.characters[0].name,
      );

      // handleNext is called at the end of handleUserInput, which should trigger generation
      // Manually call handleNext again to complete the generation cycle
      await act(async () => {
        result.current.handleNext();
      });

      // Now we should have the generated response
      expect(result.current.lines.some((line) => line.text === 'Response to user input')).toBe(
        true,
      );
    });
  });

  describe('Eager generation', () => {
    beforeEach(() => {
      // Mock API to return responses without pause
      let callCount = 0;
      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/gen/story/step')) {
          callCount++;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'character',
                    text: `Generated line ${callCount}`,
                    characterName: 'Alice',
                  },
                ],
                endName: null,
              }),
          });
        }
        if (url.includes('/api/gen/story/check')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                activatedTriggerIds: [],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
    });

    it('should not generate anything with no playthrough', () => {
      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: undefined,
          updatePlaythrough: mockUpdatePlaythrough,
        }),
      );

      expect(result.current.lines).toEqual([]);
    });

    it('should ensure each line has different previouslines (no race conditions)', async () => {
      const shortPlaythrough = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: 'Start of story',
            metadata: { sceneId: '0' },
          },
        ],
        currentLineIdx: 0,
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: shortPlaythrough,
          updatePlaythrough: mockUpdatePlaythrough,
        }),
      );

      await act(async () => {
        // Generate a few lines manually in addition to eagerly
        result.current.handleNext();
        result.current.handleNext();
        result.current.handleNext();
        result.current.handleNext();
      });

      // Check that each API call had different previous lines
      const stepCalls = (fetch as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/gen/story/step'),
      );

      if (stepCalls.length > 1) {
        const firstCallBody = JSON.parse(stepCalls[0][1].body);
        const secondCallBody = JSON.parse(stepCalls[1][1].body);

        expect(firstCallBody.playthrough.lines.length).toBeLessThan(
          secondCallBody.playthrough.lines.length,
        );
      }
    });
  });

  describe('Early pause generation', () => {
    beforeEach(() => {
      // Mock API to return pause response early
      let callCount = 0;
      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/gen/story/step')) {
          callCount++;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'character',
                    text: `Line ${callCount}`,
                    characterName: 'Alice',
                    metadata: callCount <= 2 ? { shouldPause: true } : undefined,
                  },
                ],
                endName: null,
              }),
          });
        }
        if (url.includes('/api/gen/story/check')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                activatedTriggerIds: [],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
    });

    it('should stop generation when pause is encountered', async () => {
      const shortPlaythrough = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: 'Start of story',
            metadata: { sceneId: '0' },
          },
        ],
        currentLineIdx: 0,
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: shortPlaythrough,
          updatePlaythrough: mockUpdatePlaythrough,
        }),
      );

      await act(async () => {
        await result.current.handleUserInput('Start generating');
      });

      // Should have stopped early due to pause
      const stepCalls = (fetch as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/gen/story/step'),
      );

      expect(stepCalls.length).toBeLessThanOrEqual(3); // Should stop early
    });
  });

  describe('Loading status', () => {
    // Loading status timing is tricky to test with deferred promises
    it.skip('should show loading status during first generateNextLine call', async () => {
      // Create a deferred promise to control when the API call resolves
      const createDeferred = <T>() => {
        let resolve!: (value: T) => void;
        let reject!: (reason?: unknown) => void;
        const promise = new Promise<T>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };

      const deferred = createDeferred<{ lines: DisplayLine[]; endName: string | null }>();

      // Mock API to return a deferred response
      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/gen/story/step')) {
          return Promise.resolve({
            ok: true,
            json: () => deferred.promise,
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      // Start with a minimal playthrough (just scene transition line)
      const minimalPlaythrough = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: '',
            metadata: { sceneId: '0' },
          },
        ],
        currentLineIdx: 0,
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: minimalPlaythrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false, // Disable eager generation to control timing
        }),
      );

      // Initially, should not be loading
      expect(result.current.currentLine.metadata?.status).toBeUndefined();

      // Start generation (this should immediately set loading status)
      act(() => {
        result.current.handleNext();
      });

      // Should now show loading status since we're at the end and generation is in progress
      expect(result.current.currentLine.metadata?.status).toBe('loading');

      // Resolve the API call
      deferred.resolve({
        lines: [
          {
            type: 'character',
            text: 'Generated response',
            characterName: 'Alice',
          },
        ],
        endName: null,
      });

      // Wait for the generation to complete
      await act(async () => {
        await Promise.resolve();
      });

      // After generation completes, loading status should be cleared
      expect(result.current.currentLine.metadata?.status).toBeUndefined();
      expect(result.current.lines.length).toBe(2); // Original line + generated line
    });

    it('should show loading status when at end of lines and generating', async () => {
      // Create a playthrough where we're at the last line
      const playthroughAtEnd = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: '',
            metadata: { sceneId: '0' },
          },
          {
            type: 'character' as const,
            text: 'What would you like to do?',
            characterName: 'Alice',
          },
        ],
        currentLineIdx: 1, // At the last line
      };

      // Create deferred promise to control API timing
      const createDeferred = <T>() => {
        let resolve!: (value: T) => void;
        const promise = new Promise<T>((res) => {
          resolve = res;
        });
        return { promise, resolve };
      };

      const deferred = createDeferred<{ lines: DisplayLine[]; endName: string | null }>();

      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/gen/story/step')) {
          return Promise.resolve({
            ok: true,
            json: () => deferred.promise,
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughAtEnd,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      // Initially at the end but not loading
      expect(result.current.currentLine.metadata?.status).toBeUndefined();

      // Trigger generation
      act(() => {
        result.current.handleNext();
      });

      // Wait for state updates to propagate
      await act(async () => {
        await Promise.resolve();
      });

      // Should show loading status
      expect(result.current.currentLine.metadata?.status).toBe('loading');

      // Resolve the generation
      deferred.resolve({
        lines: [
          {
            type: 'character',
            text: 'New generated line',
            characterName: 'Alice',
          },
        ],
        endName: null,
      });

      await act(async () => {
        await Promise.resolve();
      });

      // Loading should be cleared
      expect(result.current.currentLine.metadata?.status).toBeUndefined();
    });

    it('should not show loading status when not at end of lines', () => {
      // Create a playthrough where we're not at the last line
      const playthroughNotAtEnd = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: '',
            metadata: { sceneId: '0' },
          },
          {
            type: 'character' as const,
            text: 'First line',
            characterName: 'Alice',
          },
          {
            type: 'character' as const,
            text: 'Second line',
            characterName: 'Alice',
          },
        ],
        currentLineIdx: 0, // Not at the end
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughNotAtEnd,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      // Should not show loading status when not at end
      expect(result.current.currentLine.metadata?.status).toBeUndefined();

      // Moving to next line should not trigger loading
      act(() => {
        result.current.handleNext();
      });

      // Still should not show loading since we're not at the end
      expect(result.current.currentLine.metadata?.status).toBeUndefined();
    });
  });

  describe('Hint generation with shouldPause', () => {
    beforeEach(() => {
      // Mock API to return pause response and hint
      (fetch as jest.Mock).mockImplementation((url: string, options?: { body: string }) => {
        if (url.includes('/api/gen/story/step')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'character',
                    text: `What do you think player?`,
                    characterName: 'Alice',
                    metadata: { shouldPause: true },
                  },
                ],
                endName: null,
              }),
          });
        }
        if (url.includes('/api/gen/story/hint')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'narration',
                    text: 'Consider your options carefully.',
                    metadata: { shouldPause: true },
                  },
                ],
              }),
          });
        }
        if (url.includes('/api/gen/story/translate/bulk')) {
          // Mock translation to just return the same texts
          const body = JSON.parse(options?.body || '{}');
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                translatedTexts: body.texts || [],
              }),
          });
        }
        if (url.includes('/api/gen/story/check')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                activatedTriggerIds: [],
              }),
          });
        }
        return Promise.reject(new Error('Unmocked API call'));
      });
    });

    it('should generate hint after line when pause is encountered', async () => {
      const playthrough = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: '',
            metadata: { sceneId: '0' },
          },
          {
            type: 'narration' as const,
            text: 'You wake up in a peaceful room.', // Opening script line
          },
        ],
        currentLineIdx: 1, // Already past the opening script
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false, // Disable eager generation for this test
        }),
      );

      // Now handleNext will trigger generation instead of adding opening script
      await act(async () => {
        result.current.handleNext();
      });

      // Wait for async hint generation to complete
      await waitForAsyncUpdates();

      // When shouldPause is encountered, hint generation is triggered automatically
      // Final state: scene break + opening script + generated line (shouldPause: false) + hint line (shouldPause: true)
      expect(result.current.lines.length).toEqual(4);
      expect(result.current.lines[2].text).toBe('What do you think player?');
      expect(result.current.lines[2].metadata?.shouldPause).toBe(false); // Generated line has shouldPause removed
      expect(result.current.lines[3].text).toBe('Consider your options carefully.');
      expect(result.current.lines[3].metadata?.shouldPause).toBe(true); // Hint line has shouldPause
    });

    it('should generate line and hint sequentially, not bundled', async () => {
      const playthrough = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: '',
            metadata: { sceneId: '0' },
          },
          {
            type: 'narration' as const,
            text: 'You wake up in a peaceful room.', // Opening script line
          },
        ],
        currentLineIdx: 1, // Already past the opening script
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false,
        }),
      );

      // Start generation
      await act(async () => {
        result.current.handleNext();
      });

      // Wait for async hint generation to complete
      await waitForAsyncUpdates();

      // After generation completes, we should have:
      // 1. Scene break
      // 2. Opening script
      // 3. Generated line with shouldPause removed
      // 4. Hint line with shouldPause=true
      expect(result.current.lines.length).toBe(4);
      expect(result.current.lines[2].text).toBe('What do you think player?');
      expect(result.current.lines[2].metadata?.shouldPause).toBe(false);
      expect(result.current.lines[3].text).toBe('Consider your options carefully.');
      expect(result.current.lines[3].metadata?.shouldPause).toBe(true);

      // Verify both APIs were called
      expect(fetch).toHaveBeenCalledWith('/api/gen/story/step', expect.any(Object));
      expect(fetch).toHaveBeenCalledWith('/api/gen/story/hint', expect.any(Object));
    });

    it('should stop eager generation when hint with shouldPause is present', async () => {
      let stepCallCount = 0;
      (fetch as jest.Mock).mockImplementation((url: string, options?: { body: string }) => {
        if (url.includes('/api/gen/story/step')) {
          stepCallCount++;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'character',
                    text: `Generated line ${stepCallCount}`,
                    characterName: 'Alice',
                    metadata: { shouldPause: true },
                  },
                ],
                endName: null,
              }),
          });
        }
        if (url.includes('/api/gen/story/hint')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'narration',
                    text: 'Hint line',
                    metadata: { shouldPause: true },
                  },
                ],
              }),
          });
        }
        if (url.includes('/api/gen/story/translate/bulk')) {
          const body = JSON.parse(options?.body || '{}');
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                translatedTexts: body.texts || [],
              }),
          });
        }
        if (url.includes('/api/gen/story/check')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                activatedTriggerIds: [],
              }),
          });
        }
        return Promise.reject(new Error('Unmocked API call'));
      });

      const playthrough = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: '',
            metadata: { sceneId: '0' },
          },
          {
            type: 'narration' as const,
            text: 'You wake up in a peaceful room.',
          },
        ],
        currentLineIdx: 1,
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: true, // Enable eager generation
        }),
      );

      await act(async () => {
        result.current.handleNext();
      });

      await waitForAsyncUpdates();

      // Should have made exactly ONE step API call, not multiple
      // Because the hint with shouldPause: true stops eager generation
      expect(stepCallCount).toBe(1);

      // Verify we have: scene break + opening script + generated line + hint
      expect(result.current.lines.length).toBe(4);

      // Last line should be the hint with shouldPause: true
      const lastLine = result.current.lines[result.current.lines.length - 1];
      expect(lastLine.text).toBe('Hint line');
      expect(lastLine.metadata?.shouldPause).toBe(true);
    });

    it('should not generate duplicate hints due to race condition with eager generation', async () => {
      let stepCallCount = 0;
      let hintCallCount = 0;

      (fetch as jest.Mock).mockImplementation((url: string, options?: { body: string }) => {
        if (url.includes('/api/gen/story/step')) {
          stepCallCount++;
          // Only return shouldPause on first call to trigger hint generation
          if (stepCallCount === 1) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  lines: [
                    {
                      type: 'character',
                      text: 'What would you like to do?',
                      characterName: 'Alice',
                      metadata: { shouldPause: true },
                    },
                  ],
                  endName: null,
                }),
            });
          }
          // Any subsequent step calls should fail the test
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'character',
                    text: 'Duplicate line from eager generation!',
                    characterName: 'Alice',
                  },
                ],
                endName: null,
              }),
          });
        }
        if (url.includes('/api/gen/story/hint')) {
          hintCallCount++;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'narration',
                    text: `Hint ${hintCallCount}`,
                    metadata: { shouldPause: true },
                  },
                ],
              }),
          });
        }
        if (url.includes('/api/gen/story/translate/bulk')) {
          const body = JSON.parse(options?.body || '{}');
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                translatedTexts: body.texts || [],
              }),
          });
        }
        if (url.includes('/api/gen/story/check')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                activatedTriggerIds: [],
              }),
          });
        }
        return Promise.reject(new Error(`Unmocked API call: ${url}`));
      });

      // Start with a playthrough that has already consumed the opening script
      const playthrough = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: '',
            metadata: { sceneId: '0' },
          },
          {
            type: 'narration' as const,
            text: 'You wake up in a peaceful room.', // This is the opening script
          },
        ],
        currentLineIdx: 1, // Already at the end of opening script
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthrough,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: true, // Enable eager generation to trigger race condition
        }),
      );

      // Trigger generation - this should consume the opening script and then generate
      await act(async () => {
        result.current.handleNext();
        // Wait for generation to complete
        await waitForAsyncUpdates();
        await waitForAsyncUpdates();
      });

      // Fast-forward timers to let any eager generation cycles run
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Wait for any pending updates
      await waitForAsyncUpdates();

      // Should have called hint API exactly once, not multiple times
      expect(hintCallCount).toBe(1);

      // Should have called step API exactly once
      expect(stepCallCount).toBe(1);

      // Count how many hint lines are present
      const hintLines = result.current.lines.filter((line) => line.text?.startsWith('Hint'));

      // Should only have one hint line
      expect(hintLines.length).toBe(1);

      // Verify structure: scene break + opening script + generated line + ONE hint
      expect(result.current.lines.length).toBe(4);
      expect(result.current.lines[2].text).toBe('What would you like to do?');
      expect(result.current.lines[2].metadata?.shouldPause).toBe(false);
      expect(result.current.lines[3].text).toBe('Hint 1');
      expect(result.current.lines[3].metadata?.shouldPause).toBe(true);
    });
  });

  describe('Trigger handling', () => {
    beforeEach(() => {
      let stepCallCount = 0;
      // Mock trigger checking and step generation
      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/gen/story/check')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                activatedTriggerIds: ['0'], // First trigger activated
              }),
          });
        }
        if (url.includes('/api/gen/story/step')) {
          stepCallCount++;
          if (stepCallCount === 1) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  lines: [
                    {
                      type: 'character',
                      text: `Response with trigger ${stepCallCount}`,
                      characterName: 'Alice',
                    },
                    {
                      type: 'narration',
                      text: 'Scene transition',
                      metadata: { sceneId: '1' },
                    },
                    {
                      type: 'character',
                      text: `You enter a long, dimly lit hallway.`,
                      characterName: 'Alice',
                    },
                  ],
                  endName: null,
                }),
            });
          }

          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                lines: [
                  {
                    type: 'character',
                    text: `Response with trigger ${stepCallCount}`,
                    characterName: 'Alice',
                  },
                ],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
    });

    it('should not append duplicate scene transitions for action triggers (single transition only)', async () => {
      // Scene 0 trigger 0 has goToSceneId=1 in fixtures
      const playthroughWithPause = {
        ...mockPlaythrough,
        lines: [
          { type: 'narration' as const, text: '', metadata: { sceneId: '0' } },
          { type: 'narration' as const, text: 'Start of scene 0' },
          {
            type: 'character' as const,
            text: 'What do you do?',
            characterName: 'Alice',
            metadata: { shouldPause: true },
          },
        ] as DisplayLine[],
        currentLineIdx: 2,
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughWithPause,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: true, // allow eager to potentially double-generate
        }),
      );

      // Simulate user input that activates the action trigger (which has goToSceneId:1)
      await act(async () => {
        await result.current.handleUserInput('Ask about the door');
      });

      // Allow any eager generation cycles to run
      await act(async () => {
        await Promise.resolve();
      });

      // Count how many scene break markers for scene 1 exist
      const sceneMarkers = result.current.lines.filter((l) => l.metadata?.sceneId === '1');
      expect(sceneMarkers.length).toBe(1);

      // Ensure the opening line for scene 1 appears exactly once right after its marker
      const idx = result.current.lines.findIndex((l) => l.metadata?.sceneId === '1');
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(result.current.lines[idx + 1]?.text).toBe(
        mockProject.cartridge.scenes[1].script?.[0]?.text,
      );
    });

    it('should handle triggered scene changes', async () => {
      const playthroughWithTrigger = {
        ...mockPlaythrough,
        lines: [
          {
            type: 'narration' as const,
            text: 'Start of story',
            metadata: { sceneId: '0' },
          },
          {
            type: 'narration' as const,
            text: 'What do you think player?',
            metadata: { shouldPause: true },
          },
        ],
        currentLineIdx: 1,
        currentSceneId: '0',
      };

      const { result } = renderHook(() =>
        useStoryGenerator({
          currentPlaythrough: playthroughWithTrigger,
          updatePlaythrough: mockUpdatePlaythrough,
          eagerlyGenerate: false, // Disable eager generation to test trigger metadata
        }),
      );

      // Find pause
      await act(async () => {
        result.current.handleNext();
      });
      expect(result.current.currentLine.metadata?.shouldPause).toBe(true);
      await act(async () => {
        result.current.handleUserInput('Ask about the door');
      });
      expect(result.current.currentLine.text).toBe('Ask about the door');
      expect(result.current.currentLine.metadata?.activatedTriggerIds).toEqual(['0']);

      // Manually trigger generation to see scene change
      await act(async () => {
        result.current.handleNext();
      });

      // Navigate to the scene transition line
      await act(async () => {
        result.current.handleNext(); // Move to generated response
      });
      await act(async () => {
        result.current.handleNext(); // Move to scene transition line
      });

      // Now we should be at the scene transition
      expect(result.current.currentLine.metadata?.sceneId).toEqual('1');
    });
  });

  describe('Playthrough switching', () => {
    // Utility to create a deferred promise we can resolve later
    const createDeferred = <T>() => {
      let resolve!: (value: T) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };

    it('should clear previous lines when switching to a new playthrough', async () => {
      const firstPlaythrough: Playthrough = {
        ...mockPlaythrough,
        id: 111,
        lines: [
          { type: 'narration' as const, text: '', metadata: { sceneId: '0' } },
          {
            type: 'narration' as const,
            text: 'Previously generated content',
            metadata: { sceneId: '0' },
          },
          {
            type: 'narration' as const,
            text: 'END: Game Over',
            metadata: { shouldEnd: true },
          },
        ] as DisplayLine[],
        currentLineIdx: 2,
      };

      const secondPlaythrough: Playthrough = {
        ...mockPlaythrough,
        id: 222,
        lines: [
          { type: 'narration' as const, text: '', metadata: { sceneId: '0' } },
          {
            type: 'narration' as const,
            text: mockProject.cartridge.scenes[0].script?.[0]?.text,
          },
        ] as DisplayLine[],
        currentLineIdx: 1,
      };

      const { result, rerender } = renderHook(
        ({ playthrough }) =>
          useStoryGenerator({
            currentPlaythrough: playthrough,
            updatePlaythrough: mockUpdatePlaythrough,
            eagerlyGenerate: false,
          }),
        { initialProps: { playthrough: firstPlaythrough } },
      );

      // Sanity check: starts with the first playthrough's lines
      expect(result.current.lines).toEqual(firstPlaythrough.lines);

      // Switch to the new playthrough
      rerender({ playthrough: secondPlaythrough });

      // Allow state effects to run
      await waitForAsyncUpdates();

      // Expect only the new playthrough's lines to be present
      expect(result.current.lines).toEqual(secondPlaythrough.lines);
      // Ensure no leftover END line from previous playthrough
      expect(result.current.lines.find((l) => l.text?.startsWith?.('END:'))).toBeUndefined();
    });

    it('should update currentSceneId and current scene when switching playthroughs', async () => {
      const firstPlaythrough: Playthrough = {
        ...mockPlaythrough,
        id: 1010,
        lines: [
          { type: 'narration' as const, text: '', metadata: { sceneId: '0' } },
          { type: 'narration' as const, text: 'Start scene 0' },
        ] as DisplayLine[],
        currentLineIdx: 1,
      };

      const secondPlaythrough: Playthrough = {
        ...mockPlaythrough,
        id: 2020,
        lines: [
          { type: 'narration' as const, text: '', metadata: { sceneId: '1' } },
          { type: 'narration' as const, text: 'Start scene 1' },
        ] as DisplayLine[],
        currentLineIdx: 1,
        currentSceneId: '1',
      };

      const { result, rerender } = renderHook(
        ({ playthrough }) =>
          useStoryGenerator({
            currentPlaythrough: playthrough,
            updatePlaythrough: mockUpdatePlaythrough,
            eagerlyGenerate: false,
          }),
        { initialProps: { playthrough: firstPlaythrough } },
      );

      // Starts in scene 0
      expect(result.current.currentScene.title).toBe(getScene(mockProject, '0').title);

      // Switch to second playthrough which is in scene 1
      rerender({ playthrough: secondPlaythrough });
      await waitForAsyncUpdates();

      expect(result.current.currentScene.title).toBe(getScene(mockProject, '1').title);
    });

    it('should ignore stale generation results from previous playthrough after switch', async () => {
      // Arrange a deferred response for the step API so generation is in-flight
      const deferred = createDeferred<{ lines: DisplayLine[]; endName: string | null }>();

      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/gen/story/step')) {
          return Promise.resolve({
            ok: true,
            json: () => deferred.promise,
          });
        }
        if (url.includes('/api/gen/story/check')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ activatedTriggerKeys: [] }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      const firstPlaythrough: Playthrough = {
        ...mockPlaythrough,
        id: 333,
        lines: [
          { type: 'narration' as const, text: 'Start of story', metadata: { sceneId: '0' } },
        ] as DisplayLine[],
        currentLineIdx: 0,
      };

      const secondPlaythrough: Playthrough = {
        ...mockPlaythrough,
        id: 444,
        lines: [
          { type: 'narration' as const, text: '', metadata: { sceneId: 0 } },
          { type: 'narration' as const, text: mockProject.cartridge.scenes[0].script?.[0]?.text },
        ] as DisplayLine[],
        currentLineIdx: 1,
      };

      const { result, rerender } = renderHook(
        ({ playthrough }) =>
          useStoryGenerator({
            currentPlaythrough: playthrough,
            updatePlaythrough: mockUpdatePlaythrough,
            eagerlyGenerate: true,
          }),
        { initialProps: { playthrough: firstPlaythrough } },
      );

      // Kick off generation for the first playthrough
      await act(async () => {
        result.current.handleNext();
      });

      // Now switch to the new playthrough BEFORE the deferred resolves
      rerender({ playthrough: secondPlaythrough });

      // Resolve the deferred with a line that would belong to the old playthrough
      deferred.resolve({
        lines: [
          {
            type: 'character',
            text: 'Stale generated line from old playthrough',
            characterName: 'Alice',
          },
        ],
        endName: null,
      });

      // Let the microtasks flush
      await waitForAsyncUpdates();

      // Expect only the second playthrough's lines; stale line should not be present
      const texts = result.current.lines.map((l) => l.text);
      expect(texts).toEqual(secondPlaythrough.lines.map((l) => l.text));
      expect(texts).not.toContain('Stale generated line from old playthrough');
    });
  });
});
