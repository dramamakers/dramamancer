/**
 * ProjectContext provides the project data & playthrough management that powers the game.
 *
 * For Game components:
 * - In EDIT mode: Automatically uses live project data from EditorProjectContext
 * - In PLAY mode: Uses stable project data that only updates on page refresh
 *
 * This separation ensures that:
 * - Editor mode game refreshes based on live edits
 * - Play mode shows stable data that only updates on page refresh
 */

'use client';
import { getDefaultPlaythrough } from '@/app/constants';
import { Playthrough, Project, StoryState } from '@/app/types';
import { useStoryGenerator } from '@/components/Game/hooks/useStoryGenerator';
import { useToastStore } from '@/store/toast';
import {
  clearRecentlyPlayedCache,
  usePlaythroughMutations,
  usePlaythroughsForProject,
} from '@/utils/api/hooks';
import { useColor } from '@/utils/color';
import { getSceneSprite } from '@/utils/game';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../Auth/AuthContext';
import { useOutdated } from './hooks/useOutdated';
import { PlaythroughUpdateProps } from './utils/types';

export interface ProjectContextType {
  mode: 'play' | 'edit';

  // Project management
  project: Project;
  loading: boolean;
  setProject: Dispatch<SetStateAction<Project>>;

  // Playthrough management
  currentPlaythrough: Playthrough | undefined;
  playthroughs: Playthrough[];
  updatePlaythrough: (props: PlaythroughUpdateProps) => Promise<void>;

  // Story state (current line)
  storyState: StoryState;
  isHistoryOpen: boolean;
  handleShowHistory: (isOpen: boolean) => void;

  // UI details adapt to current scene image
  textColor: string | undefined;
  backgroundColor: string | undefined;

  // Read-only mode for viewing others' playthroughs
  readOnly?: boolean;

  // Sharing
  playthroughToShare: Playthrough | undefined;
  sharePlaythrough: Dispatch<SetStateAction<Playthrough | undefined>>;

  // Outdated warning
  outdated: boolean;

  // God mode
  godMode: boolean;
  setGodMode: Dispatch<SetStateAction<boolean>>;
}

export const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({
  children,
  mode,
  project: initialProject,
}: {
  children: ReactNode;
  mode: 'play' | 'edit';
  project: Project;
}) {
  const [project, setProject] = useState<Project>(initialProject);
  const [playthroughToShare, sharePlaythrough] = useState<Playthrough | undefined>(undefined);
  const [godMode, setGodMode] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const [currentPlaythrough, setCurrentPlaythrough] = useState<Playthrough | undefined>(undefined);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const readOnly = useMemo(() => {
    if (!currentPlaythrough) return false;
    return currentPlaythrough.userId !== user?.userId;
  }, [currentPlaythrough, user?.userId]);

  /* Playthrough management */
  const {
    data: playthroughs = [],
    refetch: refetchPlaythroughs,
    loading: playthroughsLoading,
  } = usePlaythroughsForProject(project.id || -1);
  const {
    createPlaythrough: createPlaythroughMutation,
    updatePlaythrough: updatePlaythroughMutation,
  } = usePlaythroughMutations();
  const { addToast, removeToast } = useToastStore();

  const handleUpdatePlaythrough = async (playthroughId: number, updates: Partial<Playthrough>) => {
    const oldPlaythrough = currentPlaythrough;
    setCurrentPlaythrough((p) => (p ? { ...p, ...updates } : p));
    try {
      if (playthroughId != -1) {
        // Skip update for default playthrough (e.g., test playing in quickstart editor)
        await updatePlaythroughMutation(playthroughId, updates);
      }
    } catch (error) {
      console.error('Failed to update playthrough:', error);
      setCurrentPlaythrough(oldPlaythrough);
    }
  };

  const updatePlaythrough = useCallback(
    async (props: PlaythroughUpdateProps) => {
      switch (props.action) {
        case 'clear':
          setCurrentPlaythrough(undefined);
          break;
        case 'create':
          if (project.id !== -1) {
            const newPlaythrough = await createPlaythroughMutation({
              projectId: project.id,
              projectSnapshot: project,
              ...(props.playthrough || {}),
            });
            setCurrentPlaythrough(newPlaythrough);
            clearRecentlyPlayedCache();
          } else {
            setCurrentPlaythrough({
              ...(await getDefaultPlaythrough(project, user?.userId || '')),
            });
          }
          break;
        case 'load':
          setCurrentPlaythrough(props.playthrough);
          clearRecentlyPlayedCache();
          break;
        case 'progress':
          await handleUpdatePlaythrough(props.playthroughId, {
            ...props.updates,
          });
          clearRecentlyPlayedCache();
          break;
        case 'settings':
          await handleUpdatePlaythrough(props.playthroughId, {
            ...props.updates,
          });
          break;
        case 'updateSnapshot':
          await handleUpdatePlaythrough(props.playthroughId, {
            projectSnapshot: props.updates.updateFn(currentPlaythrough?.projectSnapshot || project),
          });
          break;
        case 'duplicate':
          if (currentPlaythrough && project.id !== -1) {
            const updates = props.updates || {};
            const newLines = updates.lines || currentPlaythrough.lines;
            const newLineIdx = updates.currentLineIdx ?? currentPlaythrough.currentLineIdx;
            const newSceneId = updates.currentSceneId || currentPlaythrough.currentSceneId;

            // First, create a duplicate of the current playthrough to preserve it
            await createPlaythroughMutation({
              projectId: project.id,
              projectSnapshot: project,
              lines: newLines,
              currentLineIdx: newLineIdx,
              currentSceneId: newSceneId,
              title: currentPlaythrough.title
                ? `${currentPlaythrough.title} (branched)`
                : undefined,
            });

            // Then create a new playthrough that will be the active one for branching
            const newPlaythrough = await createPlaythroughMutation({
              projectId: project.id,
              projectSnapshot: project,
              lines: newLines,
              currentLineIdx: newLineIdx,
              currentSceneId: newSceneId,
            });

            if (newPlaythrough) {
              setCurrentPlaythrough(newPlaythrough);
              clearRecentlyPlayedCache();
            }
          }
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentPlaythrough,
      createPlaythroughMutation,
      updatePlaythroughMutation,
      project.id,
      refetchPlaythroughs,
      addToast,
      removeToast,
      project,
    ],
  );

  /* Story generation */
  const storyState = useStoryGenerator({
    currentPlaythrough,
    updatePlaythrough,
    readOnly,
    eagerlyGenerate: true,
  });

  const searchParams = useSearchParams();

  // Initialize empty playthrough for edit mode
  useEffect(() => {
    if (mode === 'edit' && !currentPlaythrough && !playthroughsLoading && user) {
      updatePlaythrough({ action: 'create' });
    }
  }, [mode, currentPlaythrough, playthroughsLoading, user, updatePlaythrough]);

  // Load shared playthrough when playthroughId query changes (play mode only)
  useEffect(() => {
    if (mode !== 'play') return;

    const id = searchParams.get('playthroughId');
    if (!id) return;

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/data/playthroughs/${id}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const pt = await res.json();
        if (pt?.projectId === project.id) {
          // If the playthrough belongs to the player, load the last line
          // Otherwise, load the display line or the first line
          const currentLineIdx = pt.userId === user?.userId ? pt.lines.length - 1 : 0;
          await updatePlaythrough({
            action: 'load',
            playthrough: {
              ...pt,
              currentLineIdx,
            },
          });
          // Clean URL: remove playthroughId param
          router.replace(`/play/${project.id}`, { scroll: false });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        // ignore
      }
    })();

    return () => controller.abort();
  }, [mode, searchParams, project.id, router, updatePlaythrough, user?.userId]);

  /* Visual styling */
  const { textColor, backgroundColor } = useColor(
    getSceneSprite(project, storyState.currentScene.uuid)?.imageUrl ?? '',
  );

  const handleShowHistory = useCallback((isOpen: boolean) => {
    setIsHistoryOpen(isOpen);
  }, []);

  const { outdated } = useOutdated({ project, currentPlaythrough, readOnly });

  return (
    <ProjectContext.Provider
      value={{
        mode,
        project,
        loading: playthroughsLoading,
        setProject,
        storyState,
        currentPlaythrough,
        playthroughs,
        updatePlaythrough,
        backgroundColor,
        textColor,
        readOnly,
        playthroughToShare,
        sharePlaythrough,
        isHistoryOpen,
        handleShowHistory,
        outdated,
        godMode,
        setGodMode,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
