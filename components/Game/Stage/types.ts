import { Sprite } from '@/app/types';

export type SpritePosition = 'left' | 'right' | 'center';

export type StageSprite = {
  sprite: Sprite;
  isSpeaking: boolean;
  position: SpritePosition;
};
