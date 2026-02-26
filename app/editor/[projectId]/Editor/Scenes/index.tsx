import { getBlankScene } from '@/app/constants';
import Button from '@/components/Button';
import { generateSceneUuid, generateTriggerUuid } from '@/utils/uuid';
import { useEditorProject } from '../../EditorContext';
import Scene from './Scene';
import { SceneProvider } from './SceneContext';

export function ScenesList() {
  const { project, updateProject } = useEditorProject();
  const { scenes } = project.cartridge;

  const addBlankScene = () => {
    const newSceneId = generateSceneUuid();
    const blankScene = getBlankScene(newSceneId);
    const newScene = {
      ...blankScene,
      uuid: newSceneId,
      characterIds: [],
      triggers: blankScene.triggers.map((t) => ({ ...t, uuid: generateTriggerUuid(newSceneId) })),
    };
    const newScenes = [...scenes, newScene];
    updateProject(
      (draft) => {
        draft.cartridge.scenes = newScenes;
      },
      {
        message: 'added scene',
        context: JSON.stringify({
          sceneId: newScene.uuid,
          scene: newScene,
        }),
      },
    );
  };

  return (
    <div>
      <h1 id="scenes">Scenes</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Create scenes for your characters to explore and interact in. The game will begin on the
        first scene.
      </p>
      <div className="flex flex-col pt-4 gap-4">
        {scenes.map((scene, index) => (
          <div key={`scene-${scene.uuid}`}>
            <SceneProvider sceneId={scenes[index].uuid} index={index}>
              <Scene />
            </SceneProvider>
          </div>
        ))}
        <Button onClick={addBlankScene} className="px-3">
          + Add scene
        </Button>
      </div>
    </div>
  );
}
