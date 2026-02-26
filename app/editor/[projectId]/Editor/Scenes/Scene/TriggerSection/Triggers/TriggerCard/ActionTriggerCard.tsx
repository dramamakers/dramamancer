import { ActionTrigger } from '@/app/types';
import Button from '@/components/Button';
import CollapsibleCard from '@/components/CollapsibleCard';
import { useTooltip } from '@/components/Tooltip/TooltipContext';
import { BoltIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTrigger } from '../TriggerContext';
import ChangeScene from './components/Advanced/ChangeScene';
import Dependencies from './components/Advanced/Dependencies';
import Condition from './components/Condition';
import EventImage from './components/Image';
import Narrative from './components/Narrative';
import Summary from './components/Summary';

export function ActionTriggerCard() {
  const { trigger, deleteTrigger, showAdvancedTriggerModal } = useTrigger();
  const { showTooltip, hideTooltip } = useTooltip();
  const actionTrigger = trigger?.type === 'action' ? (trigger as ActionTrigger) : null;

  if (!actionTrigger) return null;

  const actions = (
    <div className="flex gap-1">
      <Button
        variant="icon"
        className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-600 hover:text-blue-500 cursor-pointer transition-opacity"
        onMouseOver={() => showTooltip('Make your rule more powerful')}
        onMouseOut={hideTooltip}
        onClick={(e) => {
          e.stopPropagation();
          hideTooltip();
          showAdvancedTriggerModal();
        }}
      >
        <BoltIcon className="w-4 h-4" />
      </Button>
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
    </div>
  );

  return (
    <>
      <CollapsibleCard
        header={<Summary />}
        actions={actions}
        backgroundImage={actionTrigger.eventImageUrl}
      >
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <hr className="flex-1 border-slate-400 dark:border-slate-600" />
            <h2 className="text-slate-600 dark:text-slate-400!">If this condition is met...</h2>
            <hr className="flex-1 border-slate-400 dark:border-slate-600" />
          </div>

          <div className="flex flex-col gap-1">
            <div>
              <h2>Describe the condition:</h2>
              <Condition className="bg-white! dark:bg-slate-900!" />
            </div>
            {actionTrigger.dependsOnTriggerIds &&
              actionTrigger.dependsOnTriggerIds.length !== 0 && (
                <div>
                  <h2>This rule is unlocked ONLY if another action rule has triggered:</h2>
                  <div className="flex-1">
                    <Dependencies className="bg-white! dark:bg-slate-900! w-full" />
                  </div>
                </div>
              )}
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
          {actionTrigger.eventImageUrl && <EventImage />}
        </div>
      </CollapsibleCard>
    </>
  );
}
