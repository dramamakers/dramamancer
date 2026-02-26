import { Character, Scene } from '@/app/types';
import HelpLabel from '@/components/Help';
import { useEditorProject } from '../../../EditorContext';
import CharacterDropdown from '../../CharacterDropdown';
import { useScene } from '../SceneContext';

export function CastSection() {
  const { scene } = useScene();
  const { project, updateProject } = useEditorProject();
  const { characters } = project.cartridge;
  const playerId = project.settings.playerId;

  const handleUpdateScene = (updates: Partial<Scene>) => {
    updateProject((draft) => {
      const sceneIndex = draft.cartridge.scenes.findIndex((s) => s.uuid === scene.uuid);
      if (sceneIndex !== -1) {
        draft.cartridge.scenes[sceneIndex] = { ...draft.cartridge.scenes[sceneIndex], ...updates };
      }
    });
  };

  const selectedCharacters = characters.filter(
    (character) => character.uuid === playerId || scene.characterIds.includes(character.uuid),
  );

  const handleCharacterToggle = (character: Character) => {
    if (character.uuid === playerId) return;
    if (scene.characterIds.includes(character.uuid)) {
      handleUpdateScene({ characterIds: scene.characterIds.filter((id) => id !== character.uuid) });
    } else {
      handleUpdateScene({ characterIds: [...scene.characterIds, character.uuid] });
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <HelpLabel label="Cast" tips={[{ type: 'prompt' }, { type: 'public' }]} />
      </div>
      <CharacterDropdown
        scene={scene}
        characters={characters}
        selectedCharacters={selectedCharacters}
        onToggle={handleCharacterToggle}
        multiSelect={true}
      />
    </div>
  );
}
