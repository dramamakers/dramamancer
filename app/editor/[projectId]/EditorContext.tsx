'use client';
import { ModalRegistry, ModalStackEntry } from '@/app/editor/components/Modals/types';
import { Project } from '@/app/types';
import { TooltipProvider } from '@/components/Tooltip';
import { useToastStore } from '@/store/toast';
import { useProjectMutations, useTraceLogger } from '@/utils/api/hooks';
import { isPlaythroughOutdatedForEdit } from '@/utils/playthrough';
import { validate } from '@/utils/validate';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useProject } from '../../../components/Game/ProjectContext';
import { useNavigationConfirmation } from '../hooks/useNavigationConfirmation';
import { EntityType } from '../utils/entity';
import { useImageGeneration } from '../utils/generate';
import { LogResult, useBatchedLogger } from '../utils/log';

export const CURRENT_PROJECT_VERSION = `dramamancer-v1`;

interface EditorProjectContextType {
  project: Project;
  isSaving: boolean;
  saveError: string | null;
  hasUnsavedChanges: boolean;

  /* Actions */
  saveProject: () => Promise<void>;
  updateProject: (
    updates: Partial<Project> | ((draft: Project) => void),
    logResult?: LogResult,
  ) => void;
  generationStatus: 'idle' | 'loading' | 'success' | 'error';
  handleImageGeneration: ({
    id,
    entityType,
    prompt,
  }: {
    id?: string;
    entityType: EntityType;
    prompt: string;
  }) => Promise<string | undefined>;
  handleVideoGeneration: ({
    id,
    entityType,
    imageUrl,
    prompt,
  }: {
    id: string;
    entityType: EntityType;
    imageUrl: string;
    prompt?: string;
  }) => Promise<string | null>;

  /* Modals */
  activeModal: ModalStackEntry | null;
  openModal: (modal: keyof ModalRegistry, data?: ModalRegistry[keyof ModalRegistry]) => void;
  closeModal: () => void;
}

const EditorProjectContext = createContext<EditorProjectContextType | null>(null);

export function EditorProjectProvider({ children }: { children: ReactNode }) {
  const { project, setProject, currentPlaythrough, updatePlaythrough, mode } = useProject();
  const { status, handleImageGeneration, handleVideoGeneration } = useImageGeneration();

  // Project mutations
  const { updateProject: updateProjectMutation } = useProjectMutations();
  const [saveState, setSaveState] = useState({
    isSaving: false,
    saveError: null as string | null,
    hasUnsavedChanges: false,
  });
  const { isSaving, saveError, hasUnsavedChanges } = saveState;
  const [activeModal, setActiveModal] = useState<ModalStackEntry | null>(null);
  const { log: originalLog } = useTraceLogger();
  const batchedLog = useBatchedLogger(originalLog);
  const { addToast } = useToastStore();

  // Navigation confirmation for unsaved changes
  useNavigationConfirmation({
    isSaving,
    hasUnsavedChanges,
  });

  const updateProject = useCallback(
    (updates: Partial<Project> | ((draft: Project) => void), logResult?: LogResult) => {
      try {
        if (logResult) {
          batchedLog(project.id, logResult);
        }

        setProject((prev) => {
          const next: Project =
            typeof updates === 'function'
              ? (() => {
                  const draft = structuredClone(prev);
                  updates(draft);
                  return draft;
                })()
              : { ...prev, ...updates };

          if (
            currentPlaythrough &&
            currentPlaythrough.currentSceneId &&
            mode === 'edit' &&
            !isPlaythroughOutdatedForEdit(next, currentPlaythrough)
          ) {
            updatePlaythrough({
              action: 'updateSnapshot',
              playthroughId: currentPlaythrough.id,
              updates: {
                updateFn: () => next,
              },
            });
          }

          return next;
        });
        setSaveState((prev) => ({ ...prev, hasUnsavedChanges: true }));
      } catch (error) {
        throw error;
      }
    },
    [batchedLog, project.id, setProject, currentPlaythrough, updatePlaythrough, mode],
  );

  const saveProject = useCallback(async () => {
    if (!hasUnsavedChanges || isSaving) return;
    setSaveState((prev) => ({ ...prev, isSaving: true, saveError: null }));

    try {
      const validationError = validate(project);
      if (validationError) {
        throw new Error(`Invalid project data: ${validationError}`);
      }

      updateProject({ updatedAt: Date.now() });
      await updateProjectMutation(project.id, {
        title: project.title,
        settings: project.settings,
        version: project.version,
        cartridge: project.cartridge,
      });
      setSaveState((prev) => ({ ...prev, hasUnsavedChanges: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save project';

      if (errorMessage.includes('')) {
        addToast('Invalid project data. Please check your project and try again.', 'error');
        return;
      }

      addToast(errorMessage, 'error');
      setSaveState((prev) => ({ ...prev, saveError: errorMessage }));
      setProject((prev) => ({
        ...prev,
        settings: { ...prev.settings, visibility: 'private' },
      }));
      console.error('Failed to save project:', error, project);
    } finally {
      setSaveState((prev) => ({ ...prev, isSaving: false }));
    }
  }, [
    project,
    hasUnsavedChanges,
    updateProject,
    isSaving,
    updateProjectMutation,
    addToast,
    setProject,
  ]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timeoutId = setTimeout(() => {
      saveProject();
    }, 1500); // Debounce save by 1.5 seconds

    return () => clearTimeout(timeoutId);
  }, [hasUnsavedChanges, saveProject]);

  const handleSubmitImageGeneration = useCallback(
    async ({
      id,
      prompt,
      entityType,
    }: {
      id?: string;
      prompt: string;
      entityType: EntityType;
    }): Promise<string | undefined> => {
      try {
        const imageUrl = await handleImageGeneration({ id, prompt, entityType });
        return imageUrl;
      } catch (error) {
        console.error('Failed to generate image:', error);
        return undefined;
      }
    },
    [handleImageGeneration],
  );

  const handleSubmitVideoGeneration = useCallback(
    async ({
      id,
      imageUrl,
      entityType,
      prompt,
    }: {
      id: string;
      imageUrl: string;
      entityType: EntityType;
      prompt?: string;
    }): Promise<string | null> => {
      try {
        const jobId = await handleVideoGeneration({ id, imageUrl, entityType, prompt });
        if (!jobId) {
          throw new Error('No job ID returned from video generation.');
        }
        return jobId;
      } catch (error) {
        console.error('Failed to generate video:', error);
        addToast('Failed to generate video. Please try again later.', 'error');
        return null;
      }
    },
    [handleVideoGeneration, addToast],
  );

  const openModal = useCallback(
    (modal: keyof ModalRegistry, data?: ModalRegistry[keyof ModalRegistry]) => {
      setActiveModal({ modal, data });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  return (
    <EditorProjectContext.Provider
      value={{
        project,
        isSaving,
        saveError,
        hasUnsavedChanges,
        updateProject,
        generationStatus: status,
        handleImageGeneration: handleSubmitImageGeneration,
        handleVideoGeneration: handleSubmitVideoGeneration,
        saveProject,
        activeModal,
        openModal,
        closeModal,
      }}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </EditorProjectContext.Provider>
  );
}

export function useEditorProject() {
  const context = useContext(EditorProjectContext);
  if (!context) throw new Error('useEditorProject must be used within an EditorProjectProvider');
  return context;
}
