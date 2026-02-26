import { FallbackTrigger } from '@/app/types';
import Button from '@/components/Button';
import CollapsibleCard from '@/components/CollapsibleCard';
import { useTooltip } from '@/components/Tooltip';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useTrigger } from '../TriggerContext';
import ChangeScene from './components/Advanced/ChangeScene';
import Narrative from './components/Narrative';
import Summary from './components/Summary';

export function FallbackTriggerCard() {
  const { showTooltip, hideTooltip } = useTooltip();
  const { trigger, updateTrigger, deleteTrigger } = useTrigger();
  const fallbackTrigger = trigger?.type === 'fallback' ? (trigger as FallbackTrigger) : null;

  if (!fallbackTrigger) {
    return (
      <div className="w-full p-4 rounded-lg h-20">
        <span className="text-slate-400 dark:text-slate-600">Click to set up this rule</span>
      </div>
    );
  }

  const deleteAction = (
    <Button
      variant="icon"
      className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-600 hover:text-red-500 cursor-pointer transition-opacity"
      onMouseOver={() => showTooltip('Delete rule')}
      onMouseOut={hideTooltip}
      onClick={(e) => {
        e.stopPropagation();
        hideTooltip();
        if (window.confirm('Are you sure you want to delete this trigger?')) {
          deleteTrigger();
        }
      }}
    >
      <TrashIcon className="w-4 h-4" />
    </Button>
  );

  return (
    <CollapsibleCard header={<Summary />} actions={deleteAction}>
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <hr className="flex-1 border-slate-400 dark:border-slate-600" />
          <h2 className="text-slate-600 dark:text-slate-400!">If this condition is met...</h2>
          <hr className="flex-1 border-slate-400 dark:border-slate-600" />
        </div>

        <div className="flex items-center gap-2">
          <h2>When no other rules are met after</h2>{' '}
          <select
            value={fallbackTrigger.k}
            onChange={(e) => updateTrigger({ k: parseInt(e.target.value) })}
            className="w-fit bg-white! dark:bg-slate-900! h-8 p-0!"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
            <option value={7}>7</option>
            <option value={8}>8</option>
            <option value={9}>9</option>
            <option value={10}>10</option>
          </select>{' '}
          <h2>player turns</h2>
        </div>

        <div className="flex gap-2 items-center">
          <hr className="flex-1 border-slate-400 dark:border-slate-600" />
          <h2 className="text-slate-600 dark:text-slate-400!">Then this will happen...</h2>
          <hr className="flex-1 border-slate-400 dark:border-slate-600" />
        </div>

        <Narrative className="bg-white! dark:bg-slate-900!" />

        <div>
          <h2>Change the scene (optional):</h2>
          <ChangeScene className="bg-white! dark:bg-slate-900!" />
        </div>
      </div>
    </CollapsibleCard>
  );
}
