import { FaGamepad as Gamepad2, FaHeart as Heart, FaBolt as Zap } from 'react-icons/fa';

export const assets = {
  hero: {
    catCharacter: '/landing/images/overlay_stage.jpg',
    starSticker: '/landing/vector/star_small.svg',
    penIcon: '/landing/images/pen.png',
    backgroundVideo: '/landing/videos/hero.mp4',
  },

  systemIntro: {
    trailerVideo: '/landing/videos/trailer.mp4',
    videoPoster: '/landing/images/overlay_stage.jpg',
  },

  steps: {
    step1: '/landing/images/step_1.gif',
    step2: '/landing/images/step_2.gif',
    step3: '/landing/images/step_3.gif',
    background: '/landing/images/overlay_stage.jpg',
  },

  features: {
    specialFeature: '/images/game_preview_vertical.png',
  },

  games: {
    game1: '/landing/images/step_1.gif',
    game2: '/landing/images/step_2.gif',
    game3: '/landing/images/step_3.gif',
    cassette: '/landing/images/cassette.png',
  },

  vectors: {
    starLarge: '/landing/vector/star_large.svg',
    starSmall: '/landing/vector/star_small.svg',
  },

  videos: {
    hero: '/landing/videos/hero.mp4',
  },
};

export const steps: {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  side: 'left' | 'right';
}[] = [
  {
    step: '01',
    title: 'Write',
    subtitle: '',
    description:
      'Tell us everything about your world — your characters, scenes, and what consequences follow each action. Use our image and video models to add visual flair.',
    icon: <Gamepad2 className="w-14 h-14" />,
    side: 'left',
  },
  {
    step: '02',
    title: 'Playtest',
    subtitle: '',
    description:
      "Try playing your own story. Does it feel right? Tweak your setup and play until it's perfect. Every playthrough is unique, but clearer instructions help keep things on track.",
    icon: <Zap className="w-14 h-14" />,
    side: 'right',
  },
  {
    step: '03',
    title: 'Publish',
    subtitle: '',
    description:
      'Release your game for everyone to play. Players collect characters and endings as they play, and get to share memorable playthroughs and gameplay moments.',
    icon: <Heart className="w-14 h-14" />,
    side: 'left',
  },
];
