import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { Character, Cutout, DEFAULT_SPRITE_ID } from '@/app/types';
import { useToastStore } from '@/store/toast';
import { getSprite } from '@/utils/game';
import { useState } from 'react';
import { generateCutoutImage } from './utils';

export function useCutout({
  character,
  setCharacter,
}: {
  character: Character;
  setCharacter: (character: Character) => void;
}) {
  const { activeModal } = useEditorProject();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { addToast } = useToastStore();
  const sprite = getSprite(character);

  const onCutoutChange = (cutout: Partial<Cutout>) => {
    const imageUrl = cutout.imageUrl || sprite?.cutout?.imageUrl || '';
    if (!imageUrl) {
      throw new Error('No image URL provided when editing cutout');
    }

    setCharacter({
      ...character,
      sprites: {
        ...character.sprites,
        [DEFAULT_SPRITE_ID]: {
          ...sprite,
          cutout: { imageUrl, ...sprite?.cutout, ...cutout },
        },
      },
    });
  };

  const handleCutoutImage = async () => {
    if (status === 'loading' || !activeModal?.data || !sprite) return;
    try {
      setStatus('loading');

      // Update Character with completed cutout
      const result = await generateCutoutImage(sprite.imageUrl);
      onCutoutChange({ imageUrl: result.cutoutUrl });
      setStatus('success');
    } catch (error) {
      console.error('Error generating cutout:', error);

      addToast('Cut-out generation failed', 'error');
      setStatus('error');
    }
  };

  return {
    sprite,
    handleCutoutImage,
    status,
    onCutoutChange,
  };
}
