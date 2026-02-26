import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import SpriteCard from '@/app/editor/components/SpriteCard';
import { EntityType } from '@/app/editor/utils/entity';
import { QuickstartImageData } from '@/app/types';
import Image from 'next/image';
import { useCallback } from 'react';
import { useChatContext } from '../ChatContext';

export default function ImageSelectAction({ disabled = false }: { disabled?: boolean }) {
  const { handleImageUpload, state } = useChatContext();
  const { project, closeModal } = useEditorProject();
  // Use state.image directly instead of prop to ensure we always have the latest value
  const image = state.image;

  const updateAndSaveImage = useCallback(
    (newImageData: QuickstartImageData) => {
      handleImageUpload(newImageData);
    },
    [handleImageUpload],
  );

  const processImageUrl = useCallback(
    (url: string) => {
      // Save the image URL for API calls
      // We'll fetch and compress only when needed for API calls
      updateAndSaveImage({
        data: '',
        mediaType: '',
        preview: url,
        url,
      });
    },
    [updateAndSaveImage],
  );

  return (
    <div className="flex flex-col gap-3 w-full max-w-md ml-10">
      <SpriteCard
        hasImage={!!image?.preview}
        placeholderText={`Drag and drop an image URL, or click to add an image.`}
        imageSelectModalProps={{
          type: EntityType.QUICKSTART,
          entity: project,
          updateEntity: (updates) => {
            const url = updates.imageUrl;
            processImageUrl(url);
            closeModal();
          },
        }}
        className="min-h-48"
        disabled={disabled}
      >
        {image?.preview && (
          <Image
            src={image?.preview}
            alt="Selected"
            className="w-full h-full object-cover"
            width={100}
            height={100}
          />
        )}
      </SpriteCard>
    </div>
  );
}
