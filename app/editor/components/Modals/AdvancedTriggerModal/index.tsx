import Background from '@/app/editor/[projectId]/Editor/Scenes/Scene/TriggerSection/Triggers/TriggerCard/components/Advanced/Background';
import ChangeScene from '@/app/editor/[projectId]/Editor/Scenes/Scene/TriggerSection/Triggers/TriggerCard/components/Advanced/ChangeScene';
import Dependencies from '@/app/editor/[projectId]/Editor/Scenes/Scene/TriggerSection/Triggers/TriggerCard/components/Advanced/Dependencies';
import Condition from '@/app/editor/[projectId]/Editor/Scenes/Scene/TriggerSection/Triggers/TriggerCard/components/Condition';
import Narrative from '@/app/editor/[projectId]/Editor/Scenes/Scene/TriggerSection/Triggers/TriggerCard/components/Narrative';
import { useTrigger } from '@/app/editor/[projectId]/Editor/Scenes/Scene/TriggerSection/Triggers/TriggerContext';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

export function AdvancedTriggerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { trigger } = useTrigger();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Advanced rule maker"
      subtitle={`Add more details to your ${trigger.type === 'action' ? 'action' : 'fallback'} rule. Everything except for the condition is optional.`}
      className="flex flex-col gap-4"
      actions={<Button onClick={onClose}>Close</Button>}
    >
      <div className="flex gap-4 items-center">
        <hr className="flex-1 border-slate-300 dark:border-slate-700" />
        <h2>Condition (if this happens...)</h2>
        <hr className="flex-1 border-slate-300 dark:border-slate-700" />
      </div>
      <div>
        <h2>Describe your condition:</h2>
        <Condition />
      </div>
      <div>
        <h2>This rule is unlocked by another action rule</h2>
        <Dependencies />
      </div>
      <div className="flex gap-4 items-center">
        <hr className="flex-1 border-slate-300 dark:border-slate-700" />
        <h2>Event (then this will happen...)</h2>
        <hr className="flex-1 border-slate-300 dark:border-slate-700" />
      </div>
      <Narrative />
      <div>
        <h2>Change the scene:</h2>
        <ChangeScene />
      </div>
      <Background />
    </Modal>
  );
}
