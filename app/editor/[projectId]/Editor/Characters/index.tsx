import { PlusIcon } from '@heroicons/react/24/outline';
import { useEditorProject } from '../../EditorContext';
import { CharacterCard } from './CharacterCard';

export function CharactersList() {
  const { project, openModal } = useEditorProject();
  const { characters } = project.cartridge;

  const handleOpenModal = (characterUuid?: string) => {
    if (characterUuid) {
      openModal('editCharacter', {
        uuid: characterUuid,
        characterData: characters.find((character) => character.uuid === characterUuid)!,
      });
      return;
    }
    openModal('createCharacter');
  };

  return (
    <div>
      <h1 id="characters">Characters</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Create and manage the characters that will appear in your game.
      </p>
      <div className="flex flex-wrap gap-2 pt-4">
        {characters.map((character) => (
          <CharacterCard key={character.uuid} character={character} />
        ))}
        <div
          onClick={() => handleOpenModal()}
          className="h-24 w-24 px-4 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer hover:opacity-80"
        >
          <PlusIcon className="w-8 h-8 text-slate-400 dark:text-slate-600" />
        </div>
      </div>
    </div>
  );
}
