import { Character, DEFAULT_SPRITE_ID, Scene } from '@/app/types';
import Button from '@/components/Button';
import { generateCharacterUuid } from '@/utils/uuid';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { CharacterIcon } from '../../components/CharacterIcon';
import { EditCharacterModalData } from '../../components/Modals/types';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { useEditorProject } from '../EditorContext';

interface MultiSelectCharacterDropdownProps {
  scene: Scene;
  characters: Character[];
  selectedCharacters: Character[];
  onToggle: (character: Character) => void;
  multiSelect: true;
}

interface SingleSelectCharacterDropdownProps {
  scene: Scene;
  characters: Character[];
  selectedCharacter?: Character;
  onSelect: (character: Character) => void;
  onClear?: () => void;
  allowClear?: boolean;
  multiSelect?: false;
}

type CharacterDropdownProps =
  | MultiSelectCharacterDropdownProps
  | SingleSelectCharacterDropdownProps;

export default function CharacterDropdown(props: CharacterDropdownProps) {
  const { scene, characters } = props;
  const { updateProject, openModal, project } = useEditorProject();
  const playerId = project.settings.playerId;

  const handleCharacterAction = (character: Character) => {
    if (props.multiSelect) {
      props.onToggle(character);
    } else {
      props.onSelect(character);
    }
  };

  const handleEditCharacter = (character: Character) => {
    openModal('editCharacter', {
      uuid: character.uuid,
      characterData: character,
    });
  };

  const handleCreateNew = (name: string) => {
    const newCharacter = {
      uuid: generateCharacterUuid(),
      name,
      description: '',
      sprites: {
        [DEFAULT_SPRITE_ID]: {
          imageUrl: '',
        },
      },
    };

    // Only create the character in cartridge, don't add to scene yet
    updateProject(
      (draft) => {
        draft.cartridge.characters.push(newCharacter);
      },
      {
        message: 'created character',
        context: JSON.stringify({ character: newCharacter }),
      },
    );

    // Auto-open edit modal for immediate configuration
    // Pass sceneId so it can be added to scene on save (not cancel/delete)
    openModal('editCharacter', {
      uuid: newCharacter.uuid,
      characterData: newCharacter,
      sceneId: scene.uuid, // Pass scene context for later association
      isNewlyCreated: true, // Flag to indicate this is a newly created entity
    } as EditCharacterModalData);
  };

  const isMultiSelect = props.multiSelect === true;
  const selectedCharacters = isMultiSelect
    ? props.selectedCharacters
    : props.selectedCharacter
      ? [props.selectedCharacter]
      : [];

  if (isMultiSelect) {
    return (
      <SearchableDropdown<Character>
        placeholder="Search characters or type to create new..."
        emptyStateText="No characters created yet"
        noResultsText="No available characters found"
        items={characters}
        selectedItems={props.selectedCharacters}
        multiSelect={true}
        onItemToggle={handleCharacterAction}
        getItemId={(character: Character) => character.uuid}
        getItemName={(character: Character) => character.name}
        getItemDescription={(character: Character) => character.description}
        filterItems={(items: Character[], searchValue: string) =>
          items.filter(
            (character: Character) =>
              character.name.toLowerCase().includes(searchValue.toLowerCase()) &&
              character.uuid !== playerId &&
              !selectedCharacters.includes(character),
          )
        }
        renderSelectedDisplay={(selectedItems: Character[], onClick: () => void) => (
          <div
            className="flex flex-col gap-2 p-2 bg-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2 cursor-pointer"
            onClick={onClick}
          >
            {selectedItems.length === 0 ? (
              <span className="text-slate-500 dark:text-slate-400">No characters selected</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((character: Character) => {
                  const isPlayer = character.uuid === playerId;
                  return (
                    <div
                      key={character.uuid}
                      className={twMerge(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-white dark:bg-slate-700',
                      )}
                    >
                      <CharacterIcon character={character} />
                      <span>
                        {character.name}
                        {isPlayer && ' (Player)'}
                      </span>
                      <div className="flex">
                        <Button
                          variant="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCharacter(character);
                          }}
                          title={`Edit ${character.name}`}
                        >
                          <PencilIcon className="w-3 h-3" />
                        </Button>
                        {!isPlayer && (
                          <Button
                            variant="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              props.onToggle(character);
                            }}
                            title={`Remove ${character.name}`}
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        renderItemOption={(character: Character, isHighlighted: boolean, onClick: () => void) => {
          const isPlayer = character.uuid === playerId;
          return (
            <button
              key={character.uuid}
              type="button"
              onClick={onClick}
              className={twMerge(
                'w-full p-3 text-left border-b border-slate-200 dark:border-slate-700 last:border-b-0 cursor-pointer',
                isHighlighted
                  ? 'bg-slate-100 dark:bg-slate-700'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700',
              )}
            >
              <div className="flex items-center gap-2">
                <CharacterIcon character={character} className="w-8 h-8" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {character.name}
                    {isPlayer && ' (Player)'}
                  </div>
                  {character.description && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {character.description}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        }}
        onCreateNew={handleCreateNew}
        allowCreate={true}
      />
    );
  }

  // Single select mode
  return (
    <SearchableDropdown<Character>
      placeholder="Search characters or type to create new..."
      emptyStateText="No characters created yet"
      noResultsText="No available characters found"
      items={characters}
      selectedItem={props.selectedCharacter}
      multiSelect={false}
      onItemSelect={handleCharacterAction}
      onClear={props.onClear}
      allowClear={props.allowClear}
      getItemId={(character: Character) => character.uuid}
      getItemName={(character: Character) => character.name}
      getItemDescription={(character: Character) => character.description}
      filterItems={(items: Character[], searchValue: string) =>
        items.filter(
          (character: Character) =>
            character.name.toLowerCase().includes(searchValue.toLowerCase()) &&
            character.uuid !== playerId &&
            !selectedCharacters.includes(character),
        )
      }
      clearSelectionText="Narrator"
      renderSelectedDisplay={(selectedItem: Character | undefined, onClick: () => void) => (
        <div
          className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 cursor-pointer"
          onClick={onClick}
        >
          {!selectedItem ? (
            <span className="text-slate-500 dark:text-slate-400">Narrator</span>
          ) : (
            <div className="flex items-center gap-2">
              <CharacterIcon character={selectedItem} />
              <span className="flex-1">
                {selectedItem.name}
                {selectedItem.uuid === playerId && ' (Player)'}
              </span>
              <div className="flex">
                <Button
                  variant="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCharacter(selectedItem);
                  }}
                  title={`Edit ${selectedItem.name}`}
                >
                  <PencilIcon className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      renderItemOption={(character: Character, isHighlighted: boolean, onClick: () => void) => {
        const isPlayer = character.uuid === playerId;
        return (
          <button
            key={character.uuid}
            type="button"
            onClick={onClick}
            className={twMerge(
              'w-full p-3 text-left border-b border-slate-200 dark:border-slate-700 last:border-b-0 cursor-pointer',
              isHighlighted
                ? 'bg-slate-100 dark:bg-slate-700'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700',
            )}
          >
            <div className="flex items-center gap-2">
              <CharacterIcon character={character} className="w-8 h-8" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {character.name}
                  {isPlayer && ' (Player)'}
                </div>
                {character.description && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {character.description}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      }}
      onCreateNew={handleCreateNew}
      allowCreate={true}
    />
  );
}
