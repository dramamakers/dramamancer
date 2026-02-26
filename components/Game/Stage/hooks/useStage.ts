import { Character, SpriteDisplay } from '@/app/types';
import { findBestCharacterMatch, getCharacter, getPlayerCharacter, getSprite } from '@/utils/game';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProject } from '../../ProjectContext';

interface StageCharacters {
  left: Character | null;
  right: Character | null;
  center: Character | null;
}

interface StageState {
  rightCharacter: Character | null;
  shouldClearSprites: boolean;
  lastActiveCharacter: Character | null;
  isGameRestarted: boolean;
}

export function useStage(): StageCharacters {
  const { project, storyState } = useProject();
  const characters = useMemo(
    () => [
      getPlayerCharacter(project),
      ...storyState.currentScene.characterIds.map((id) => getCharacter(project, id)),
    ],
    [project, storyState.currentScene],
  );
  const currentLine = storyState.currentLine;
  const currentSceneId = storyState.currentScene.uuid;

  const previousSceneIdRef = useRef<string | undefined>(currentSceneId);
  const gameStartedRef = useRef<boolean>(false);

  // Consolidated state to reduce re-renders
  const [stageState, setStageState] = useState<StageState>({
    rightCharacter: null,
    shouldClearSprites: false,
    lastActiveCharacter: null,
    isGameRestarted: false,
  });

  // Memoize enabled characters to avoid recalculating on every render
  const enabledCharacters = useMemo(() => {
    if (!characters || !Array.isArray(characters)) return [];

    return characters.filter((char) => {
      const sprite = getSprite(char);
      return sprite.display === SpriteDisplay.CUTOUT && sprite?.cutout?.imageUrl;
    });
  }, [characters]);

  // Memoize player character (first enabled character)
  const player = useMemo(() => enabledCharacters[0] || null, [enabledCharacters]);

  // Optimized state update function
  const updateStageState = useCallback((updates: Partial<StageState>) => {
    setStageState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Game restart detection - when currentLine becomes null/undefined after being active
  useEffect(() => {
    if (!currentLine && gameStartedRef.current) {
      // Game has been restarted
      updateStageState({
        isGameRestarted: true,
        shouldClearSprites: true,
        rightCharacter: null,
        lastActiveCharacter: null,
      });
      gameStartedRef.current = false;
    } else if (currentLine && !gameStartedRef.current) {
      // Game has started
      gameStartedRef.current = true;
      // Clear restart flag once game starts again
      if (stageState.isGameRestarted) {
        updateStageState({ isGameRestarted: false });
      }
    }
  }, [currentLine, stageState.isGameRestarted, updateStageState]);

  // Scene change detection
  useEffect(() => {
    if (
      currentSceneId !== undefined &&
      previousSceneIdRef.current !== undefined &&
      currentSceneId !== previousSceneIdRef.current
    ) {
      updateStageState({
        shouldClearSprites: true,
        rightCharacter: null,
        lastActiveCharacter: null,
      });
    }
    previousSceneIdRef.current = currentSceneId;
  }, [currentSceneId, updateStageState]);

  // Update right character when currentLine changes
  useEffect(() => {
    if (stageState.shouldClearSprites || enabledCharacters.length === 0) return;

    const currentSpeaker = findBestCharacterMatch(characters, currentLine?.characterName ?? '');
    const isPlayerSpeaking = currentLine?.type === 'player';
    const isNarrator = currentLine?.type === 'narration';

    // Update right character if a new NPC with sprite speaks
    if (currentSpeaker && !isPlayerSpeaking && !isNarrator) {
      const speakingNPC = enabledCharacters.find(
        (char) => char.name === currentSpeaker?.name && char !== player,
      );
      if (speakingNPC && speakingNPC !== stageState.rightCharacter) {
        updateStageState({
          rightCharacter: speakingNPC,
          lastActiveCharacter: speakingNPC,
        });
      }
    }
  }, [
    characters,
    currentLine,
    stageState.shouldClearSprites,
    stageState.rightCharacter,
    enabledCharacters,
    player,
    updateStageState,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset refs on cleanup
      gameStartedRef.current = false;
      previousSceneIdRef.current = undefined;
    };
  }, []);

  const stageCharacters = useMemo<StageCharacters>(() => {
    // Early returns for edge cases
    if (!enabledCharacters.length) {
      return { left: null, right: null, center: null };
    }

    if (storyState.currentLine.metadata?.sceneId !== undefined) {
      return { left: null, right: null, center: null };
    }

    // Clear sprites on scene change or game restart
    if (stageState.shouldClearSprites || stageState.isGameRestarted) {
      // Use setTimeout to avoid state updates during render
      setTimeout(() => updateStageState({ shouldClearSprites: false }), 0);
      return { left: null, right: null, center: null };
    }

    // Determine current speaker info with null safety
    const currentSpeaker = currentLine?.characterName;
    const isPlayerSpeaking = currentLine?.type === 'player';
    const isNarrator = currentLine?.type === 'narration';

    // Determine center sprite for compact mode
    let centerCharacter: Character | null = null;
    if (isPlayerSpeaking && player) {
      centerCharacter = player;
    } else if (
      currentSpeaker &&
      stageState.rightCharacter?.name === currentSpeaker &&
      !isNarrator
    ) {
      centerCharacter = stageState.rightCharacter;
    } else if (isNarrator && stageState.lastActiveCharacter) {
      centerCharacter = stageState.lastActiveCharacter;
    } else if (stageState.rightCharacter) {
      centerCharacter = stageState.rightCharacter;
    } else {
      centerCharacter = player;
    }

    return {
      left: player, // Player always on left in wide mode
      right: stageState.rightCharacter, // Current speaking NPC on right
      center: centerCharacter, // Active character in compact mode
    };
  }, [
    enabledCharacters.length,
    storyState.currentLine.metadata?.sceneId,
    stageState.shouldClearSprites,
    stageState.isGameRestarted,
    stageState.rightCharacter,
    stageState.lastActiveCharacter,
    currentLine?.characterName,
    currentLine?.type,
    player,
    updateStageState,
  ]);

  return stageCharacters;
}
