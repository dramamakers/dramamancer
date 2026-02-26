import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { END_SCENE_ID } from '@/app/types';
import { formatSceneTitle } from '@/utils/format';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useScene } from '../../../../../../SceneContext';
import { useTrigger } from '../../../TriggerContext';

enum EffectType {
  GOTO = 'goto',
  SCENE_END = 'scene-end',
  NONE = 'none',
}

export default function ChangeScene({ className }: { className?: string }) {
  const { project } = useEditorProject();
  const { trigger, updateTrigger } = useTrigger();
  const { scene } = useScene();

  const hideNone = trigger.type === 'fallback';
  const [effect, setEffect] = useState<EffectType>(
    trigger.goToSceneId === END_SCENE_ID
      ? EffectType.SCENE_END
      : trigger.goToSceneId
        ? EffectType.GOTO
        : hideNone
          ? EffectType.SCENE_END
          : EffectType.NONE,
  );
  const otherScenes = project?.cartridge.scenes
    .map((s, index) => ({
      ...s,
      title: formatSceneTitle(s.title, index),
    }))
    .filter((s) => s.uuid !== scene.uuid);

  useEffect(() => {
    if (trigger.goToSceneId === END_SCENE_ID) {
      setEffect(EffectType.SCENE_END);
    } else if (trigger.goToSceneId) {
      setEffect(EffectType.GOTO);
    } else if (hideNone) {
      setEffect(EffectType.SCENE_END);
    } else {
      setEffect(EffectType.NONE);
    }
  }, [trigger.goToSceneId, hideNone]);

  return (
    <div className="flex gap-2 w-full">
      <select
        className={twMerge(
          'p-2 rounded-lg outline-none cursor-pointer w-full',
          effect !== EffectType.NONE && 'w-1/2',
          className,
        )}
        value={effect}
        onChange={(e) => {
          const value = e.target.value as EffectType;
          setEffect(value);
          if (value === EffectType.GOTO) {
            updateTrigger({ goToSceneId: otherScenes[0].uuid });
          } else if (value === EffectType.SCENE_END) {
            updateTrigger({ goToSceneId: END_SCENE_ID });
          } else {
            updateTrigger({ goToSceneId: undefined });
          }
        }}
      >
        {!hideNone && <option value={EffectType.NONE}>Don&apos;t change the scene</option>}
        <option value={EffectType.GOTO} disabled={otherScenes.length === 0}>
          Go to another scene {otherScenes.length > 0 ? '' : '(make more scenes first)'}
        </option>
        <option value={EffectType.SCENE_END}>End the game</option>
      </select>

      {effect === EffectType.SCENE_END && (
        <input
          className={twMerge('w-full', className)}
          value={trigger!.endingName || ''}
          placeholder="Ending name (optional)"
          onChange={(e) => {
            const value = e.target.value;
            updateTrigger({ endingName: value });
          }}
        />
      )}

      {effect === EffectType.GOTO && otherScenes.length > 0 && (
        <select
          className={twMerge('p-2 w-full rounded-lg outline-none cursor-pointer', className)}
          value={trigger!.goToSceneId || ''}
          onChange={(e) => {
            const value = e.target.value;
            updateTrigger({ goToSceneId: value });
          }}
        >
          {otherScenes.map((scene) => (
            <option key={scene.uuid} value={scene.uuid}>
              {scene.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
