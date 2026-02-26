import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { Scene } from '@/app/types';
import { getScene } from '@/utils/game';
import { createContext, ReactNode, useContext } from 'react';

interface SceneContextValue {
  scene: Scene;
  sceneIndex: number;
  isStartingScene: boolean;
}

const SceneContext = createContext<SceneContextValue | null>(null);

interface SceneProviderProps {
  sceneId: string;
  index: number;
  children: ReactNode;
}

export function SceneProvider({ sceneId, children, index }: SceneProviderProps) {
  const { project } = useEditorProject();
  const scene = getScene(project, sceneId);

  const value: SceneContextValue = {
    scene,
    sceneIndex: index,
    isStartingScene: scene.uuid === project.settings.startingSceneId,
  };

  if (!scene) {
    throw new Error(`Scene ${sceneId} not found`);
  }

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

export function useScene(): SceneContextValue {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
}
