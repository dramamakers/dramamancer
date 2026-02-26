import { deleteSceneById, updateSceneById } from '@/app/editor/utils/edit';
import { type Scene } from '@/app/types';
import Button from '@/components/Button';
import { DropdownMenuButtonOption } from '@/components/Dropdown';
import { useProject } from '@/components/Game/ProjectContext';
import { useMenu } from '@/components/Menu';
import { formatSceneTitle } from '@/utils/format';
import { getSceneTransitionLines } from '@/utils/lines';
import {
  ArrowPathIcon,
  EllipsisVerticalIcon,
  PlayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useEditorProject } from '../../../EditorContext';
import EditableTitle from '../../EditableTitle';
import { useScene } from '../SceneContext';
import { CastSection } from './CastSection';
import { PlaceSection } from './PlaceSection';
import { ScriptSection } from './ScriptSection';
import { TriggerSection } from './TriggerSection';

export default function Scene() {
  const { project, updateProject } = useEditorProject();
  const { updatePlaythrough } = useProject();
  const { scene, sceneIndex } = useScene();
  const { showMenu } = useMenu();
  const isStartingScene = scene.uuid === project.settings.startingSceneId;

  const deleteScene = (sceneId: string) => {
    updateProject(
      (draft) => {
        deleteSceneById(draft, sceneId);
      },
      {
        message: 'deleted scene',
        context: JSON.stringify({ sceneId }),
      },
    );
  };

  const handleUpdateScene = (updates: Partial<Scene>, message?: string) => {
    updateProject(
      (draft) => {
        updateSceneById(draft, scene.uuid, updates);
      },
      {
        message: message ?? 'updated scene',
        context: JSON.stringify({ sceneId: scene.uuid, updates }),
      },
    );
  };

  const sceneOptions: DropdownMenuButtonOption[] = [
    {
      label: 'Make starting scene',
      value: 'make-starting-scene',
      disabled: isStartingScene,
      subtitle: isStartingScene ? 'Scene is already the starting scene.' : undefined,
      Icon: ArrowPathIcon,
      onSelect: () => {
        // Make this scene the starting scene
        updateProject((draft) => {
          draft.settings.startingSceneId = scene.uuid;
        });

        // Reorder scenes to put this scene first
        updateProject((draft) => {
          draft.cartridge.scenes = draft.cartridge.scenes.filter((s) => s.uuid !== scene.uuid);
          draft.cartridge.scenes.unshift(scene);
        });
      },
    },
    {
      label: 'Play from this scene',
      value: 'play-from-this-scene',
      Icon: PlayIcon,
      onSelect: async () => {
        updatePlaythrough({
          action: 'create',
          playthrough: {
            currentSceneId: scene.uuid,
            currentLineIdx: 0,
            lines: await getSceneTransitionLines({ newScene: scene }),
          },
        });
      },
    },
    ...(isStartingScene
      ? []
      : [
          {
            label: 'Delete',
            value: 'delete',
            Icon: TrashIcon,
            onSelect: () => deleteScene(scene.uuid),
          },
        ]),
  ];

  return (
    <div
      id={`scene-${scene.uuid}`}
      className="w-full flex flex-col gap-2 bg-white dark:bg-slate-900 p-4 rounded-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <EditableTitle
          title={scene.title ? `${scene.title}` : ''}
          placeholder={formatSceneTitle(scene.title, sceneIndex)}
          onSave={(title) => handleUpdateScene({ title }, 'updated scene title')}
          actions={
            <>
              <Button
                variant="icon"
                className="m-1 bg-white/70! dark:bg-slate-900/70! hover:bg-white/80! dark:hover:bg-slate-900/80! active:bg-white/90! dark:active:bg-slate-900/90! backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  showMenu(e, sceneOptions);
                }}
              >
                <EllipsisVerticalIcon className="w-4 h-4" />
              </Button>
            </>
          }
        />
      </div>
      <div className="space-y-4">
        <CastSection />
        <div>
          <PlaceSection />
          <ScriptSection />
          <TriggerSection />
        </div>
      </div>
    </div>
  );
}
