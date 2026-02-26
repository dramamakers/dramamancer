import { DisplayLine, Scene } from '@/app/types';

export async function getSceneTransitionLines({
  newScene,
}: {
  newScene: Scene;
}): Promise<DisplayLine[]> {
  const lines: DisplayLine[] = [];

  // Add a scene transition marker line
  lines.push({
    type: 'narration',
    text: '',
    metadata: {
      sceneId: newScene.uuid,
      shouldPause: false,
    },
  });

  return lines;
}
