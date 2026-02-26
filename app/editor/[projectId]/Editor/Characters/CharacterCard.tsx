import { getCroppedSpriteStyle } from '@/app/constants';
import { deleteCharacterById } from '@/app/editor/utils/edit';
import { Character } from '@/app/types';
import Button from '@/components/Button';
import { DropdownMenuButtonOption } from '@/components/Dropdown';
import { useMenu } from '@/components/Menu';
import { getSprite } from '@/utils/game';
import { generateCharacterUuid } from '@/utils/uuid';
import {
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PhotoIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useEditorProject } from '../../EditorContext';

export function CharacterCard({ character }: { character: Character }) {
  const { project, updateProject, openModal } = useEditorProject();
  const { showMenu } = useMenu();
  const id = character.uuid;
  const isPlayableCharacter = id === project.settings.playerId;

  const handleEditCharacter = () => {
    openModal('editCharacter', {
      uuid: id,
      characterData: character,
    });
  };

  const deleteCharacter = () => {
    updateProject(
      (draft) => {
        deleteCharacterById(draft, id);
      },
      {
        message: 'deleted character',
        context: JSON.stringify({
          characterId: id,
          character,
        }),
      },
    );
  };

  const options: DropdownMenuButtonOption[] = [
    {
      label: 'Edit',
      value: 'edit',
      Icon: PencilIcon,
      onSelect: handleEditCharacter,
    },
    {
      label: 'Duplicate',
      value: 'duplicate',
      Icon: DocumentDuplicateIcon,
      onSelect: () => {
        updateProject(
          (draft) => {
            draft.cartridge.characters.push({
              ...character,
              uuid: generateCharacterUuid(),
            });
          },
          {
            message: 'duplicated character',
            context: JSON.stringify({ characterId: id, character }),
          },
        );
      },
    },
    ...(!isPlayableCharacter
      ? [
          {
            label: 'Delete',
            value: 'delete',
            Icon: TrashIcon,
            onSelect: () => {
              deleteCharacter();
            },
          },
          {
            label: 'Make player',
            value: 'make-player',
            Icon: UserIcon,
            onSelect: () => {
              updateProject(
                (draft) => {
                  draft.settings.playerId = character.uuid;
                },
                {
                  message: 'made character player',
                  context: JSON.stringify({
                    characterId: id,
                    character,
                  }),
                },
              );
            },
          },
        ]
      : []),
  ];

  const characterImageUrl = getSprite(character).imageUrl;
  return (
    <div className="relative flex flex-col gap-2 w-24 cursor-pointer items-center">
      <div className="absolute top-0 right-0 z-[1]">
        <Button
          variant="icon"
          className="m-1 bg-white/70! dark:bg-slate-900/70! hover:bg-white/80! dark:hover:bg-slate-900/80! active:bg-white/90! dark:active:bg-slate-900/90! backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            showMenu(e, options);
          }}
        >
          <EllipsisVerticalIcon className="w-4 h-4" />
        </Button>
      </div>
      <div
        className="relative w-full h-24 rounded-lg overflow-hidden shadow bg-slate-300 dark:bg-slate-800"
        onClick={handleEditCharacter}
      >
        {!characterImageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <PhotoIcon className="w-6 h-6 text-slate-500" />
          </div>
        ) : (
          <Image
            src={characterImageUrl}
            alt={`${character.name} image`}
            width={96}
            height={96}
            unoptimized
            loading="lazy"
            style={{
              ...getCroppedSpriteStyle(getSprite(character)),
            }}
          />
        )}
      </div>
      <p className="text-sm text-center line-clamp-2">
        {character.name} {isPlayableCharacter && '(Player)'}
      </p>
    </div>
  );
}
