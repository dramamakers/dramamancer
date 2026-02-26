import SpriteCard from '@/app/editor/components/SpriteCard';
import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { EntityType } from '@/app/editor/utils/entity';
import Asset from '@/components/Asset';
import { useTrigger } from '../../TriggerContext';

export default function EventImage() {
  const { trigger, updateTrigger } = useTrigger();
  const { closeModal } = useEditorProject();
  return (
    <div>
      <h2>This image will appear:</h2>
      <SpriteCard
        imageSelectModalProps={{
          type: EntityType.TRIGGER,
          entity: trigger,
          updateEntity: (updates) => {
            updateTrigger({ eventImageUrl: updates.imageUrl });
            closeModal();
          },
        }}
        hasImage={true}
        className="w-fit"
      >
        <Asset
          imageUrl={trigger.eventImageUrl}
          alt="Event image"
          className="aspect-3/2 max-h-50 w-auto rounded-lg"
        />
      </SpriteCard>
    </div>
  );
}
