import { getCroppedSpriteStyle } from '@/app/constants';
import { Character } from '@/app/types';
import { getSprite } from '@/utils/game';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

interface CharacterIconProps {
  character: Character | null;
  className?: string;
  showName?: boolean;
}

export function CharacterIcon({ character, className }: CharacterIconProps) {
  if (!character) {
    return null;
  }

  const characterImageUrl = getSprite(character).imageUrl;

  if (!characterImageUrl) {
    return null;
  }

  return (
    <div className={twMerge('flex items-center gap-2 justify-center w-5 h-5', className)}>
      <div className="rounded overflow-hidden relative w-full h-full">
        <Image
          src={characterImageUrl}
          alt={`${character.name} avatar`}
          width={100}
          height={100}
          unoptimized
          style={{
            ...getCroppedSpriteStyle(getSprite(character)),
          }}
        />
      </div>
    </div>
  );
}
