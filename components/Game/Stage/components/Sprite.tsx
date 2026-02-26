import { DEFAULT_CUTOUT_CONFIG } from '@/app/constants';
import { Character } from '@/app/types';
import { getSprite } from '@/utils/game';
import { motion } from 'framer-motion';
import Image from 'next/image';

const variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1, // Always fully visible, use CSS filter for dimming instead
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export default function Sprite({
  character,
  isActive,
}: {
  character: Character;
  isActive: boolean;
}) {
  const sprite = getSprite(character);
  if (!sprite?.cutout?.imageUrl) return null;

  const config = {
    ...DEFAULT_CUTOUT_CONFIG,
    ...sprite.cutout,
  };

  const verticalOffset = config.y || 0; // (positive = down, negative = up)
  const horizontalOffset = config.x || 0; // (positive = right, negative = left)
  const transforms = [
    `translateY(${verticalOffset}%)`,
    `translateX(${horizontalOffset}%)`,
    `scale(${config.scale})`,
    config.flip ? 'scaleX(-1)' : 'scaleX(1)',
  ].join(' ');

  return (
    <motion.div
      key={`${character.name}`}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        transform: transforms,
      }}
      className="z-[1] h-full w-full pointer-events-none aspect-3/4 max-w-40"
    >
      <Image
        src={sprite.cutout.imageUrl}
        alt={character.name || `Character`}
        className="object-contain h-full w-full"
        width={100}
        height={100}
        style={{
          filter: isActive ? 'brightness(1)' : 'brightness(0.7)',
          transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
        }}
      />
    </motion.div>
  );
}
