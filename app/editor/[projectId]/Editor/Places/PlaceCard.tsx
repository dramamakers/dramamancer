import { deletePlaceById } from '@/app/editor/utils/edit';
import { Place } from '@/app/types';
import Button from '@/components/Button';
import { DropdownMenuButtonOption } from '@/components/Dropdown';
import { useMenu } from '@/components/Menu';
import { getSprite } from '@/utils/game';
import { generatePlaceUuid } from '@/utils/uuid';
import {
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useEditorProject } from '../../EditorContext';

export function PlaceCard({ place }: { place: Place }) {
  const { updateProject, openModal } = useEditorProject();
  const { showMenu } = useMenu();
  const id = place.uuid;

  const handleEditPlace = () => {
    openModal('editPlace', {
      uuid: id,
      placeData: place,
    });
  };

  const options: DropdownMenuButtonOption[] = [
    {
      label: 'Edit',
      value: 'edit',
      Icon: PencilIcon,
      onSelect: handleEditPlace,
    },
    {
      label: 'Duplicate',
      value: 'duplicate',
      Icon: DocumentDuplicateIcon,
      onSelect: () => {
        updateProject(
          (draft) => {
            draft.cartridge.places.push({
              ...place,
              uuid: generatePlaceUuid(),
            });
          },
          {
            message: 'duplicated place',
            context: JSON.stringify({ placeId: id, place }),
          },
        );
      },
    },
    {
      label: 'Delete',
      value: 'delete',
      Icon: TrashIcon,
      onSelect: () => {
        updateProject(
          (draft) => {
            deletePlaceById(draft, id);
          },
          {
            message: 'deleted place',
            context: JSON.stringify({ placeId: id, place }),
          },
        );
      },
    },
  ];

  const placeImageUrl = getSprite(place).imageUrl;
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
        onClick={handleEditPlace}
      >
        {!placeImageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <PhotoIcon className="w-6 h-6 text-slate-500" />
          </div>
        ) : (
          <Image
            src={placeImageUrl}
            alt={`${place.name} image`}
            width={96}
            height={96}
            unoptimized
            loading="lazy"
            className="object-cover w-full h-full"
          />
        )}
      </div>
      <p className="text-sm text-center w-full truncate">{place.name}</p>
    </div>
  );
}
