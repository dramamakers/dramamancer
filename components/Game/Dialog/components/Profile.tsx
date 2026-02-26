import { getCroppedSpriteStyle } from '@/app/constants';
import { Sprite, SpriteDisplay } from '@/app/types';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

export default function Profile({
  sprite,
  className,
}: {
  sprite: Sprite | null;
  className?: string;
}) {
  const hasSprite = sprite && sprite.display === SpriteDisplay.CUTOUT && sprite.cutout?.imageUrl;
  if (!sprite || !sprite.imageUrl || hasSprite) {
    return null;
  }

  return (
    <div
      className={twMerge(
        'h-full w-full relative bg-white dark:bg-slate-900 overflow-hidden',
        className,
      )}
    >
      <Image
        width={200}
        height={200}
        alt={'Character sprite'}
        src={sprite.imageUrl}
        style={{
          ...getCroppedSpriteStyle(sprite),
        }}
      />
    </div>
  );
}
