/* eslint-disable react-hooks/exhaustive-deps */
import { getBlankScene } from '@/app/constants';
import { DisplayLine, DisplayLineStatus, Playthrough, StoryState } from '@/app/types';
import { useToastStore } from '@/store/toast';
import { apiClient } from '@/utils/api';
import { getPlayerCharacter, getScene } from '@/utils/game';
import { getLanguageShort, translateTexts } from '@/utils/hooks/useLocalTranslator';
import { generateSceneUuid } from '@/utils/uuid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentSceneId, getLatestSceneId, getSceneLines } from '../utils/scene';
import { PlaythroughUpdateProps } from '../utils/types';
import { TriggerManager } from './TriggerManager';

const LINES_BUFFER = 10; // Generate up until this many lines eagerly

function getEventImageUrl(lines: DisplayLine[], currentSceneId: string): string | null {
  const sceneLines = getSceneLines(lines, currentSceneId);
  for (let i = sceneLines.length - 1; i >= 0; i--) {
    const line = sceneLines[i];
    if (line.metadata?.eventImageUrl) {
      return line.metadata.eventImageUrl;
    }
  }
  return null;
}

export function useStoryGenerator({
  currentPlaythrough,
  updatePlaythrough,
  eagerlyGenerate = true,
  readOnly = false,
}: {
  currentPlaythrough?: Playthrough;
  updatePlaythrough: (props: PlaythroughUpdateProps) => Promise<void>;
  eagerlyGenerate?: boolean;
  readOnly?: boolean;
}): StoryState {
  const { addToast } = useToastStore();
  const project = currentPlaythrough?.projectSnapshot;
  const { scenes, characters, style } = project?.cartridge || {};
  const [isLoading, setIsLoading] = useState(false);
  const playthroughIdRef = useRef<number | undefined>(currentPlaythrough?.id);

  const generatingRef = useRef(false);
  const startedRef = useRef(false);
  const processingUserInputRef = useRef(false);
  const lastChainedLengthRef = useRef(0);
  const makingLocalChangesRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /* States */
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);
  const [currentLineIdx, setCurrentLineIdx] = useState(currentPlaythrough?.currentLineIdx || 0);
  const [currentSceneId, setCurrentSceneId] = useState(currentPlaythrough?.currentSceneId || '');
  const [lines, setLines] = useState<DisplayLine[]>(currentPlaythrough?.lines || []);

  /* Cancel any ongoing generation when playthrough changes */
  useEffect(() => {
    return () => {
      // Abort any ongoing generation when playthrough changes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      generatingRef.current = false;
      processingUserInputRef.current = false;
      startedRef.current = false;
    };
  }, [currentPlaythrough?.id]);

  /* Sync local state when playthrough changes (e.g., from History overlay) */
  useEffect(() => {
    if (!currentPlaythrough) return;
    if (makingLocalChangesRef.current) return; // Don't sync when we're making local changes
    const { lines, currentLineIdx, currentSceneId } = currentPlaythrough;

    // Always derive currentSceneId from the line metadata based on current position
    setLines(lines);
    setCurrentLineIdx(currentLineIdx);
    setCurrentSceneId(currentSceneId);
    setEventImageUrl(getEventImageUrl(lines, currentSceneId));
  }, [currentPlaythrough?.id]);

  // If state updates, playthrough should update (but skip in read-only mode)
  useEffect(() => {
    if (!project || readOnly) return;

    const timeoutId = setTimeout(() => {
      updatePlaythrough({
        action: 'progress',
        playthroughId: currentPlaythrough?.id,
        updates: {
          lines,
          currentLineIdx,
          currentSceneId,
        },
      });
    }, 100); // Debounce updates

    return () => clearTimeout(timeoutId);
  }, [lines, currentLineIdx, currentSceneId, project?.id, readOnly]);

  /* Reactive states */
  // Current scene is based on the currentSceneId
  const currentScene = useMemo(() => {
    if (!project || !currentSceneId) return getBlankScene(generateSceneUuid());
    return getScene(project, currentSceneId);
  }, [currentSceneId, project?.cartridge.scenes]);

  // Latest scene is based on the last line in the story
  const latestScene = useMemo(() => {
    const latestSceneId = getLatestSceneId(lines);
    if (!project || !latestSceneId) return getBlankScene(generateSceneUuid());
    return getScene(project, latestSceneId);
  }, [lines]);

  // TriggerManager is only created for the latest scene (where new content is generated)
  const triggerManager = useMemo((): TriggerManager | null => {
    if (!project || !lines || lines.length === 0) {
      return null;
    }

    // Filter lines to only include those from the latest scene
    const latestSceneLines = getSceneLines(lines, latestScene.uuid);
    return new TriggerManager(latestScene.triggers, latestSceneLines);
  }, [lines, latestScene.triggers, latestScene.uuid]);

  const currentTriggerManager = triggerManager;

  const currentLine = useMemo((): DisplayLine => {
    if (!lines || !project || lines.length === 0) {
      return { type: 'narration', text: '' } as DisplayLine;
    }

    const line = lines[currentLineIdx];
    const atEnd = currentLineIdx === lines.length - 1;

    const status: DisplayLineStatus | undefined = (() => {
      if (line && line.metadata?.shouldEnd) {
        return 'game-over';
      }

      if (atEnd) {
        if (isLoading) {
          return 'loading';
        }
        return line.metadata?.shouldPause ? 'waiting-on-user' : undefined;
      }

      return undefined;
    })();

    if (line && status) {
      const metadata = {
        ...(line.metadata || {}),
        status,
      };
      return {
        ...line,
        metadata,
      } as DisplayLine;
    }

    return line;
  }, [lines, currentLineIdx, isLoading, project]);

  const generateNextLine = useCallback(async () => {
    // Check if already generating to prevent race conditions
    if (generatingRef.current) {
      console.log('already generating, skipping');
      return;
    }

    if (!lines || !project || readOnly || isLoading) {
      console.log('not generating next line');
      return;
    }

    let currentLines = [...lines];

    // Stop immediately if already paused at the end
    const last = currentLines[currentLines.length - 1];
    if (last?.metadata?.shouldPause || last?.metadata?.shouldEnd) {
      console.log('already paused at the end');
      return;
    }

    // Error if no trigger manager
    if (!triggerManager) {
      console.log('no trigger manager');
      return;
    }

    // Mark as generating and save the current playthrough id
    generatingRef.current = true;
    playthroughIdRef.current = currentPlaythrough?.id;

    // Create abort controller for this generation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    try {
      const triggers = triggerManager.getActivatedTriggers();

      // Ensure fallback (and any other) activated triggers are recorded on the last player line
      if (triggers.length > 0 && currentLines.length > 0) {
        const lastIdx = currentLines.length - 1;
        const lastLine = currentLines[lastIdx];
        if (lastLine.type === 'player') {
          const triggerUuids = triggers.map((t) => t.uuid).filter((id): id is string => !!id);
          const existing = lastLine.metadata?.activatedTriggerIds ?? [];
          const merged = Array.from(new Set([...(existing || []), ...triggerUuids]));
          if (merged.length !== existing.length) {
            currentLines[lastIdx] = {
              ...lastLine,
              metadata: {
                ...(lastLine.metadata || {}),
                activatedTriggerIds: merged,
              },
            } as DisplayLine;
          }
        }
      }

      // Check if aborted before API call
      if (signal.aborted) {
        console.log('Generation aborted before API call');
        return;
      }

      const { lines: stepLines } = await apiClient.generateStep({
        project: project!,
        playthrough: {
          ...currentPlaythrough!,
          currentLineIdx: currentLines.length - 1,
          currentSceneId,
          lines: currentLines,
        },
        triggers,
        signal,
      });

      // Check if aborted after API call
      if (signal.aborted) {
        console.log('Generation aborted after API call');
        return;
      }

      // Translate lines
      const textsToTranslate = stepLines.map((line) => line.text);
      const translatedTexts = await translateTexts(textsToTranslate, getLanguageShort());
      stepLines.forEach((line, index) => {
        line.text = translatedTexts[index];
      });

      // if trigger event image exists, add to the line metadata
      const eventImages = triggers
        .filter((trigger) => trigger.eventImageUrl)
        .map((trigger) => trigger.eventImageUrl);
      if (eventImages.length > 0 && stepLines.length > 0) {
        stepLines[0] = {
          ...stepLines[0],
          metadata: {
            ...(stepLines[0].metadata || {}),
            eventImageUrl: eventImages[0],
          },
        };
      }

      // Ignore stale results from previous playthrough
      if (currentPlaythrough?.id !== playthroughIdRef.current) {
        return;
      }

      if (stepLines.length > 0) {
        currentLines = [...currentLines, ...stepLines];

        // Check if the generated line has shouldPause and generate a hint line
        const lastGeneratedLine = stepLines[stepLines.length - 1];
        const shouldGenerateHint = lastGeneratedLine?.metadata?.shouldPause;

        if (shouldGenerateHint) {
          // Remove shouldPause from the original line
          const modifiedStepLines = [...stepLines];
          modifiedStepLines[modifiedStepLines.length - 1] = {
            ...lastGeneratedLine,
            metadata: {
              ...lastGeneratedLine.metadata,
              shouldPause: false,
            },
          };

          // Update currentLines with the modified step lines
          currentLines = [...currentLines.slice(0, -stepLines.length), ...modifiedStepLines];

          // Check if aborted before hint generation
          if (signal.aborted) {
            console.log('Generation aborted before hint generation');
            return;
          }

          // Generate hint line
          const playerCharacter = getPlayerCharacter(project);
          if (scenes && style) {
            const { lines: hintLines } = await apiClient.getHint({
              lines: currentLines,
              scenes,
              triggerConditions: Object.values(triggerManager.possibleTriggers()).map(
                (trigger) => trigger.condition,
              ),
              style: style.prompt,
              playerCharacterName: playerCharacter.name,
            });

            // Check if aborted after hint generation
            if (signal.aborted) {
              console.log('Generation aborted after hint generation');
              return;
            }

            // translate hint lines
            const hintTextsToTranslate = hintLines.map((line) => line.text);
            const hintTranslatedTexts = await translateTexts(
              hintTextsToTranslate,
              getLanguageShort(),
            );
            hintLines.forEach((line, index) => {
              line.text = hintTranslatedTexts[index];
            });

            // Append hint lines to currentLines before setting state
            currentLines = [...currentLines, ...hintLines];
          }
        }

        // Set lines only once with both generated line(s) and hint (if applicable)
        setLines(currentLines);
      }
    } catch (err) {
      // Ignore abort errors, surface others
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err.message;
        addToast(errorMessage);
      }
    } finally {
      generatingRef.current = false;
      setIsLoading(false);
    }
  }, [lines, currentLineIdx, currentSceneId, project, readOnly]);

  // Eagerly chain generation after a kickoff until buffer/pause/transition/end
  useEffect(() => {
    if (
      !eagerlyGenerate ||
      generatingRef.current ||
      !startedRef.current ||
      processingUserInputRef.current ||
      isLoading ||
      !lines ||
      lines.length === 0
    )
      return;

    // Always consider eager from the end of lines
    const last = lines[lines.length - 1];
    if (last?.metadata?.shouldPause || last?.metadata?.shouldEnd) return;

    const diffFromIdx = lines.length - currentLineIdx;
    if (diffFromIdx >= LINES_BUFFER) return;

    // Ensure we only chain once per new length
    if (lines.length <= lastChainedLengthRef.current) return;
    lastChainedLengthRef.current = lines.length;

    // Kick another single-step generation
    generateNextLine();
  }, [currentLineIdx, lines, eagerlyGenerate, generateNextLine]);

  // Visually disable the next button if the next line is not yet generated
  const disabledNext = useMemo(() => {
    // If not the last line, return false
    if (currentLineIdx < lines.length - 1) {
      return false;
    }

    // If we still have opening script to get through
    const idxSinceSceneStart = getSceneLines(lines, currentSceneId).length - 1;
    if (idxSinceSceneStart < currentScene.script.length) {
      return false;
    }

    // If the current line is pause or end
    if (currentLine.metadata?.shouldPause || currentLine.metadata?.shouldEnd) {
      return true;
    }

    return false;
  }, [currentLine]);

  // Visually disable the back button if we're on the first line
  const disabledBack = useMemo(() => {
    return currentLineIdx <= 0;
  }, [currentLineIdx]);

  const handleLineIdxClick = (lineIdx: number) => {
    if (!project) return false;

    // Check bounds
    if (lineIdx < 0 || lineIdx >= lines.length) return false;

    // Check if the new line is in a new scene
    const newSceneId = getCurrentSceneId(lines, lineIdx);
    const isNewScene = newSceneId && newSceneId !== currentSceneId;

    if (isNewScene) {
      setEventImageUrl(getEventImageUrl(lines, newSceneId));
      setCurrentSceneId(newSceneId);
    }
    setCurrentLineIdx(lineIdx);
    return true;
  };

  const handleNext = () => {
    if (currentLineIdx < lines.length - 1) {
      const proposedIdx = currentLineIdx + 1;
      const nextLine = lines[proposedIdx];
      if (!nextLine) return;

      const eventImageUrl = nextLine?.metadata?.eventImageUrl;
      if (eventImageUrl) {
        setEventImageUrl(eventImageUrl);
      }
      return handleLineIdxClick(proposedIdx);
    }

    // Return immediately if we can return one of the opening lines
    const openingScript = currentScene.script;
    const idxSinceSceneStart = getSceneLines(lines, currentSceneId).length - 1;
    if (idxSinceSceneStart < openingScript.length) {
      const nextLine = openingScript[idxSinceSceneStart];
      setLines([...lines, nextLine]);
      setCurrentLineIdx(lines.length);
      return;
    }

    // Kickoff chaining
    // Initialize chained length to current lines to avoid double-fire at start
    startedRef.current = true;
    lastChainedLengthRef.current = lines.length;
    generateNextLine();
  };

  const handleBack = () => {
    if (disabledBack) {
      return;
    }

    const newLineIdx = currentLineIdx - 1;
    const sceneId = getCurrentSceneId(lines, newLineIdx);
    if (sceneId) {
      setEventImageUrl(getEventImageUrl(lines, sceneId));
      setCurrentSceneId(sceneId);
    }

    handleLineIdxClick(newLineIdx);
  };

  const redoFromLine = async () => {
    if (!project || !currentPlaythrough) return;

    // Cancel any ongoing generation before creating duplicate
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    generatingRef.current = false;
    processingUserInputRef.current = false;
    setIsLoading(false);

    const newLines = lines.slice(0, currentLineIdx + 1);
    await updatePlaythrough({
      action: 'duplicate',
      updates: {
        lines: newLines,
        currentLineIdx,
        currentSceneId,
      },
    });
  };

  const handleUserInput = async (input: string) => {
    if (!project || !triggerManager || !scenes || !characters || !style) return;

    processingUserInputRef.current = true;
    setIsLoading(true);
    try {
      // Append user input to the end of the existing lines
      const baseLines = lines.slice(0, currentLineIdx + 1);
      const playerCharacter = getPlayerCharacter(project);
      const userLine: DisplayLine = {
        type: 'player',
        text: input,
        characterName: playerCharacter.name,
        metadata: { shouldPause: false },
      } as DisplayLine;

      let newLines = [...baseLines, userLine];

      // Immediately show the user input to the user
      setLines(newLines);
      const newLineIdx = currentLineIdx + 1;
      setCurrentLineIdx(Math.min(newLineIdx, newLines.length - 1));

      // After user interaction, allow eager chaining if needed
      startedRef.current = true;
      lastChainedLengthRef.current = newLines.length;

      // Now check triggers in parallel while user sees their input
      const sceneLines = getSceneLines(newLines, currentSceneId || '');
      const possibleTriggers = triggerManager.possibleTriggers();
      if (Object.values(possibleTriggers).length > 0) {
        const activatedTriggerIds = await apiClient.checkTriggers({
          scenes,
          possibleTriggers,
          lines: sceneLines,
        });

        // Update the line with trigger information
        newLines = [...newLines];
        newLines[newLines.length - 1] = {
          ...userLine,
          metadata: {
            ...userLine.metadata,
            activatedTriggerIds,
            shouldPause: false,
          },
        } as DisplayLine;

        // Update lines with trigger info
        setLines(newLines);
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      addToast(error);
    } finally {
      // Allow eager generation again
      processingUserInputRef.current = false;
      setIsLoading(false);
      handleNext();
    }
  };

  const handleHintRequest = async () => {
    if (!project || !triggerManager || !scenes || !style) return;

    setIsLoading(true);
    try {
      const playerCharacter = getPlayerCharacter(project);
      const { lines: hintLines } = await apiClient.getHint({
        lines,
        scenes,
        triggerConditions: Object.values(triggerManager.possibleTriggers()).map(
          (trigger) => trigger.condition,
        ),
        style: style.prompt,
        playerCharacterName: playerCharacter.name,
      });

      // Add hint lines to current lines
      const newLines = [...lines, ...hintLines];
      setLines(newLines);
      setCurrentLineIdx(newLines.length - 1);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      addToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    lines,
    eventImageUrl,
    disabledNext: disabledNext || false,
    disabledBack: disabledBack || false,
    currentLine,
    currentScene,
    latestScene,
    triggerManager,
    currentTriggerManager,
    handleNext,
    handleBack,
    handleUserInput,
    handleHintRequest, // TESTING only
    setCurrentLineIdx,
    redoFromLine,
  };
}
