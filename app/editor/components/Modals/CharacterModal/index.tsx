import { getCroppedSpriteStyle } from '@/app/constants';
import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { deleteCharacterById, updateCharacterById } from '@/app/editor/utils/edit';
import { EntityType } from '@/app/editor/utils/entity';
import { Character, DEFAULT_SPRITE_ID } from '@/app/types';
import Asset from '@/components/Asset';
import Button from '@/components/Button';
import HelpLabel from '@/components/Help';
import Modal from '@/components/Modal';
import Textarea from '@/components/Textarea';
import { getCharacter, getSprite } from '@/utils/game';
import { generateCharacterUuid } from '@/utils/uuid';
import { useEffect, useState } from 'react';
import SpriteCard from '../../SpriteCard';
import { CreateCharacterModalData, EditCharacterModalData } from '../types';

const DEFAULT_CHARACTER: Character = {
  uuid: '',
  name: '',
  description: '',
  sprites: { [DEFAULT_SPRITE_ID]: { imageUrl: '' } },
};

export function CharacterModal() {
  const { activeModal, closeModal, openModal, project, updateProject } = useEditorProject();
  const mode = activeModal?.modal === 'editCharacter' ? 'edit' : 'create';
  const [character, setCharacter] = useState<Character>(DEFAULT_CHARACTER);

  // Initialize the character state based on the mode
  useEffect(() => {
    if (!activeModal?.data) {
      return;
    }

    if (mode === 'edit') {
      const data = activeModal.data as EditCharacterModalData;
      if (!data.uuid) {
        throw new Error('UUID is required');
      }
      setCharacter({
        ...getCharacter(project, data.uuid),
        ...(data.characterData && { ...data.characterData }),
      });
    } else if (mode === 'create') {
      const data = activeModal.data as CreateCharacterModalData;
      setCharacter({
        ...DEFAULT_CHARACTER,
        ...(data.characterData && { ...data.characterData }),
      });
    }
  }, [mode, activeModal?.data, project]);

  const handleSaveCharacter = () => {
    if (mode === 'edit') {
      handleSave();
      return;
    }

    // Create mode
    const newCharacter: Character = {
      ...character,
      uuid: generateCharacterUuid(),
    };
    updateProject(
      (draft) => {
        draft.cartridge.characters.push(newCharacter);
      },
      {
        message: 'created character',
        context: JSON.stringify({
          character: newCharacter,
        }),
      },
    );
    closeModal();
  };

  const handleSave = () => {
    const modalData = activeModal?.data as EditCharacterModalData & {
      sceneId?: string;
      isNewlyCreated?: boolean;
    };

    updateProject((draft) => {
      updateCharacterById(draft, character.uuid, character);

      // If this is a newly created character from a scene dropdown, add it to that scene
      if (modalData?.isNewlyCreated && modalData?.sceneId) {
        const sceneIndex = draft.cartridge.scenes.findIndex((s) => s.uuid === modalData.sceneId);
        if (
          sceneIndex !== -1 &&
          !draft.cartridge.scenes[sceneIndex].characterIds.includes(character.uuid)
        ) {
          draft.cartridge.scenes[sceneIndex].characterIds.push(character.uuid);
        }
      }
    });
    closeModal();
  };

  function HeaderActions() {
    return (
      <div className="flex justify-between w-full gap-2">
        <div className="flex gap-2">
          {mode === 'edit' && character.uuid !== project.settings.playerId && (
            <Button
              variant="link"
              className="flex items-center gap-1"
              onClick={() => {
                if (confirm('Are you sure you want to delete this character?')) {
                  updateProject((draft) => {
                    deleteCharacterById(draft, character.uuid);
                  });
                  closeModal();
                }
              }}
            >
              Delete
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSaveCharacter} disabled={!character.name}>
            {mode === 'edit' ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    );
  }

  const characterSprite = getSprite(character);
  return (
    <Modal
      isOpen={
        activeModal !== null &&
        (activeModal.modal === 'editCharacter' || activeModal.modal === 'createCharacter')
      }
      onClose={closeModal}
      size="lg"
      title={mode === 'edit' ? 'Edit character' : 'Create new character'}
      actions={<HeaderActions />}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-60">
          <h2>Image</h2>
          <SpriteCard
            className="relative aspect-2/3"
            hasImage={characterSprite.imageUrl !== ''}
            imageSelectModalProps={{
              type: EntityType.CHARACTER,
              entity: character,
              updateEntity: (updates: Partial<Character>) => {
                const updatedCharacter: Character = {
                  ...character,
                  sprites: {
                    [DEFAULT_SPRITE_ID]: { ...getSprite(character), ...updates },
                  },
                };
                // When called from Image select modal, Character modal is unmounted so
                // setState would be lost. Close Image select and re-open Character with
                // updated data so the image persists.
                closeModal();
                if (mode === 'edit') {
                  openModal('editCharacter', {
                    uuid: character.uuid,
                    characterData: updatedCharacter,
                  });
                } else {
                  openModal('createCharacter', { characterData: updatedCharacter });
                }
              },
            }}
          >
            <Asset
              imageUrl={characterSprite.imageUrl}
              alt="Character image"
              style={{
                ...getCroppedSpriteStyle(characterSprite),
              }}
            />
          </SpriteCard>
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h2>Name</h2>
            <input
              className="w-full"
              maxLength={30}
              value={character.name}
              onChange={(e) => {
                setCharacter({ ...character, name: e.target.value });
              }}
              placeholder="Character name"
            />
          </div>
          <div>
            <HelpLabel
              label="Description"
              tips={[
                {
                  type: 'prompt',
                  tooltip:
                    "The AI narrator will use this description as a prompt in generating the character's dialogue and actions. The player cannot see this description.",
                },
              ]}
            />
            <Textarea
              value={character.description}
              onChange={(description) => setCharacter({ ...character, description })}
              placeholder="Describe this character's personality, appearance, and role in the story..."
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
