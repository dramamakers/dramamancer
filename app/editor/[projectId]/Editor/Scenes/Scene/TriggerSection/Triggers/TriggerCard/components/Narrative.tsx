import Textarea from '@/components/Textarea';
import { twMerge } from 'tailwind-merge';
import { useTrigger } from '../../TriggerContext';

export default function Narrative({ className }: { className?: string }) {
  const { trigger, updateTrigger } = useTrigger();
  return (
    <div>
      <h2>Describe the event that follows:</h2>
      <Textarea
        value={trigger.narrative}
        onChange={(value) => updateTrigger({ narrative: value })}
        placeholder="What should happen when the condition is met? (e.g. 'Bob shouts 'Help!' then everyone rushes to the hospital')"
        maxLength={500}
        className={twMerge(className)}
      />
    </div>
  );
}
