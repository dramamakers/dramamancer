import SpriteCard from '@/app/editor/components/SpriteCard';
import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { EntityType } from '@/app/editor/utils/entity';
import Asset from '@/components/Asset';
import { useTrigger } from '../../../TriggerContext';

export default function Background() {
  const { trigger, updateTrigger } = useTrigger();
  const { closeModal } = useEditorProject();
  return (
    <div className="space-y-1 inherit">
      <h2>After this rule is triggered, this image will appear</h2>
      <div className="bg-slate-200 dark:bg-slate-800 rounded-lg w-full p-2">
        <SpriteCard
          className="flex justify-center"
          imageSelectModalProps={{
            type: EntityType.TRIGGER,
            entity: trigger,
            updateEntity: (updates) => {
              updateTrigger({ eventImageUrl: updates.imageUrl });
              closeModal();
            },
          }}
          hasImage={!!trigger.eventImageUrl && trigger.eventImageUrl !== ''}
        >
          <Asset
            imageUrl={trigger.eventImageUrl}
            alt="Event background"
            className="aspect-3/2 max-h-50 w-auto rounded-lg"
          />
        </SpriteCard>
      </div>
    </div>
  );
}
