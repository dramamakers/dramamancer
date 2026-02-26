import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { ActionTrigger, END_SCENE_ID } from '@/app/types';
import { formatSceneTitle } from '@/utils/format';
import { getSceneIndex } from '@/utils/game';
import { useMemo } from 'react';
import { useScene } from '../../../../../SceneContext';
import { useTrigger } from '../../TriggerContext';

export default function Summary() {
  const { project } = useEditorProject();
  const { trigger } = useTrigger();
  const { scene } = useScene();

  const goToScene = useMemo(() => {
    if (trigger.goToSceneId === undefined) {
      return null;
    }

    if (trigger.goToSceneId === END_SCENE_ID) {
      const endingName = trigger.endingName || 'Unnamed ending';
      return <i>end the game ({endingName})</i>;
    }

    try {
      const sceneIndex = getSceneIndex(project, trigger.goToSceneId);
      const scene = project.cartridge.scenes[sceneIndex];
      return `go to ${formatSceneTitle(scene.title, sceneIndex)}`;
    } catch (error) {
      console.warn(`Scene not found: ${trigger.goToSceneId}`, error);
      return null;
    }
  }, [trigger.goToSceneId, trigger.endingName, project]);

  const renderCondition = () => {
    if (trigger.type === 'action') {
      if (!trigger.condition) {
        return (
          <span className="text-slate-400 dark:text-slate-600">Click to set up this rule</span>
        );
      }

      const dependsOnTriggerName = trigger.dependsOnTriggerIds?.[0]
        ? (scene.triggers.find((t) => t.uuid === trigger.dependsOnTriggerIds?.[0]) as ActionTrigger)
            ?.condition || `Untitled rule`
        : null;

      return (
        <>
          <span className="text-slate-700 dark:text-slate-300">
            <span className="text-slate-500">
              {dependsOnTriggerName && `🔒 ${dependsOnTriggerName} → `}
            </span>
            {trigger.condition && <span className="font-medium">{trigger.condition}</span>}
          </span>
        </>
      );
    }

    return (
      <>
        <span className="font-medium max-w-50 text-slate-700 dark:text-slate-300">
          After {trigger.k} player turn{trigger.k === 1 ? '' : 's'}
        </span>
      </>
    );
  };

  const renderEffect = () => {
    return (
      <>
        <span className="mx-2">→</span>
        <span className="break-words">{trigger.narrative || 'Add what happens'}</span>
        {goToScene && (
          <>
            <span className="text-slate-500 mx-2">→</span>
            <span className="text-slate-600 dark:text-slate-400">{goToScene}</span>
          </>
        )}
        {trigger.eventImageUrl ? (
          <>
            <span className="text-slate-500 mx-2">→</span>
            <span className="text-slate-600 dark:text-slate-400">Show (image)</span>
          </>
        ) : null}
      </>
    );
  };

  return (
    <div>
      <p className="flex flex-wrap">
        {renderCondition()}
        {renderEffect()}
      </p>
    </div>
  );
}
