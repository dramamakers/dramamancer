import { getActionTrigger, getFallbackTrigger } from '@/app/constants';
import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { addTriggerToScene } from '@/app/editor/utils/edit';
import Button from '@/components/Button';
import HelpLabel from '@/components/Help';
import { useTooltip } from '@/components/Tooltip';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useScene } from '../../SceneContext';
import { ActionTriggerCard } from './Triggers/TriggerCard/ActionTriggerCard';
import { FallbackTriggerCard } from './Triggers/TriggerCard/FallbackTriggerCard';
import { TriggerProvider } from './Triggers/TriggerContext';

export function TriggerSection() {
  const { scene } = useScene();
  const { updateProject } = useEditorProject();
  const { showTooltip, hideTooltip } = useTooltip();

  const actionTriggers = scene.triggers.filter((t) => t.type === 'action');
  const fallbackTrigger = scene.triggers.find((t) => t.type === 'fallback');

  const addActionTrigger = () => {
    updateProject((draft) => {
      addTriggerToScene(draft, scene.uuid, getActionTrigger('', scene.uuid));
    });
  };

  const addFallbackTrigger = () => {
    updateProject((draft) => {
      addTriggerToScene(draft, scene.uuid, getFallbackTrigger(5, scene.uuid));
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex sticky top-[-20px] justify-between bg-white dark:bg-slate-900 items-center z-[2] pt-4 pb-2">
        <HelpLabel
          label="Rules"
          tips={[
            {
              type: 'prompt',
              tooltip:
                'After player turns, the AI narrator checks if conditions are true. If so, the event will be included in its next prompt.',
            },
            {
              type: 'private',
              tooltip:
                "Conditions and events are not revealed to the player until they're activated. Use this to reveal secrets.",
            },
          ]}
        />
        <Button
          variant="icon"
          onMouseOver={() => showTooltip('Add a new rule')}
          onMouseOut={hideTooltip}
          onClick={(e) => {
            e.stopPropagation();
            addActionTrigger();
          }}
        >
          <PlusIcon className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {fallbackTrigger ? (
          <TriggerProvider triggerId={fallbackTrigger.uuid}>
            <FallbackTriggerCard />
          </TriggerProvider>
        ) : (
          <Button
            variant="dotted"
            onMouseOver={() =>
              showTooltip(
                'After some number of player turns, this rule will automatically trigger. Max one per scene.',
              )
            }
            onMouseOut={hideTooltip}
            onClick={(e) => {
              e.stopPropagation();
              hideTooltip();
              addFallbackTrigger();
            }}
          >
            Add a fallback rule
            <PlusIcon className="w-4 h-4" />
          </Button>
        )}
        {actionTriggers.length > 0 && (
          <>
            {actionTriggers.map((trigger) => (
              <TriggerProvider key={trigger.uuid} triggerId={trigger.uuid}>
                <ActionTriggerCard />
              </TriggerProvider>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
