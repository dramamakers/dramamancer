import { getFallbackTrigger } from '@/app/constants';
import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { AdvancedTriggerModal } from '@/app/editor/components/Modals/AdvancedTriggerModal';
import { addTriggerToScene, deleteTriggerById, updateTriggerById } from '@/app/editor/utils/edit';
import { Trigger } from '@/app/types';
import { getTriggerById } from '@/utils/game';
import { createContext, ReactNode, useContext, useState } from 'react';
import { useScene } from '../../../SceneContext';

interface TriggerContextValue {
  trigger: Trigger;
  updateTrigger: (updatedTrigger: Partial<Trigger>) => void;
  deleteTrigger: () => void;
  showAdvancedTriggerModal: () => void;
}

const TriggerContext = createContext<TriggerContextValue | null>(null);

interface TriggerProviderProps {
  triggerId: string;
  children: ReactNode;
}

export function TriggerProvider({ triggerId, children }: TriggerProviderProps) {
  const { project, updateProject } = useEditorProject();
  const { scene } = useScene();
  const trigger = getTriggerById(project, triggerId);
  const type = trigger?.type || 'fallback';
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);

  const updateTrigger = (updatedTrigger: Partial<Trigger>) => {
    // Update project (trigger change detection and playthrough update handled in EditorContext)
    updateProject(
      (draft) => {
        let id = triggerId;

        if (type === 'fallback' && !trigger) {
          // Create a fallback trigger and use that uuid
          const newTrigger = getFallbackTrigger(5, scene.uuid);
          addTriggerToScene(draft, scene.uuid, newTrigger);
          id = newTrigger.uuid;
        }

        updateTriggerById(draft, scene.uuid, id!, updatedTrigger);
      },
      {
        message: 'updated trigger',
        context: JSON.stringify({
          sceneId: scene.uuid,
          triggerId,
          trigger: updatedTrigger,
        }),
      },
    );
  };

  const deleteTrigger = () => {
    // Update project (trigger change detection and playthrough update handled in EditorContext)
    updateProject(
      (draft) => {
        deleteTriggerById(draft, scene.uuid, triggerId!);
      },
      {
        message: 'deleted trigger',
        context: JSON.stringify({ sceneId: scene.uuid, triggerId }),
      },
    );
  };

  if (!trigger) {
    throw new Error(`Trigger ${triggerId} not found`);
  }

  const value: TriggerContextValue = {
    trigger,
    updateTrigger,
    deleteTrigger,
    showAdvancedTriggerModal: () => setShowAdvancedModal(true),
  };

  return (
    <TriggerContext.Provider value={value}>
      {children}
      <AdvancedTriggerModal
        isOpen={showAdvancedModal}
        onClose={() => setShowAdvancedModal(false)}
      />
    </TriggerContext.Provider>
  );
}

export function useTrigger(): TriggerContextValue {
  const context = useContext(TriggerContext);
  if (!context) {
    throw new Error('useTrigger must be used within a TriggerProvider');
  }
  return context;
}
