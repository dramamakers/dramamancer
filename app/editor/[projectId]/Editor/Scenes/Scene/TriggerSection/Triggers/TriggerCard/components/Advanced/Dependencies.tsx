import { twMerge } from 'tailwind-merge';
import { useScene } from '../../../../../../SceneContext';
import { useTrigger } from '../../../TriggerContext';

export default function Dependencies({ className }: { className?: string }) {
  const { trigger, updateTrigger } = useTrigger();
  const { scene } = useScene();
  if (trigger.type !== 'action') return null;

  const dependency = trigger.dependsOnTriggerIds?.[0];
  const otherTriggers = scene.triggers.filter(
    (t) => t.type === 'action' && t.uuid !== trigger.uuid,
  );

  return (
    <select
      className={twMerge(`p-2 rounded-lg outline-none cursor-pointer w-full`, className)}
      value={dependency ?? ''}
      disabled={otherTriggers.length === 0}
      onChange={(e) => {
        const value = e.target.value;
        if (value === '') {
          updateTrigger({ dependsOnTriggerIds: undefined });
        } else {
          updateTrigger({ dependsOnTriggerIds: [value] });
        }
      }}
    >
      <option value="">None{otherTriggers.length === 0 ? ' (make more rules first)' : ''}</option>
      {scene.triggers.map((t) => {
        if (t.uuid === trigger.uuid || t.type !== 'action') return null; // Don't show self or fallback triggers
        const displayName = t.condition || 'Untitled rule';
        return (
          <option key={t.uuid} value={t.uuid}>
            {displayName}
          </option>
        );
      })}
    </select>
  );
}
