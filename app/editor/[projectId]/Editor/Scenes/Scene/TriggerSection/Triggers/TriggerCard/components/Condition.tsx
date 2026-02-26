import { ActionTrigger } from '@/app/types';
import Textarea from '@/components/Textarea';
import { useTrigger } from '../../TriggerContext';

export default function Condition({ className }: { className?: string }) {
  const { trigger, updateTrigger } = useTrigger();
  const actionTrigger = trigger?.type === 'action' ? (trigger as ActionTrigger) : null;

  return (
    <Textarea
      value={actionTrigger?.condition || ''}
      onChange={(value) =>
        updateTrigger({
          condition: value,
        })
      }
      className={className}
      placeholder={'The condition (e.g. "player opens the door", "Alice is upset")'}
      maxLength={75}
    />
  );
}
