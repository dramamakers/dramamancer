import { DEFAULT_SPRITE_ID, Place, Scene } from '@/app/types';
import Button from '@/components/Button';
import HelpLabel from '@/components/Help';
import Textarea from '@/components/Textarea';
import { getSprite } from '@/utils/game';
import { generatePlaceUuid } from '@/utils/uuid';
import { PencilIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import { EditPlaceModalData } from '../../../../components/Modals/types';
import { SearchableDropdown } from '../../../../components/SearchableDropdown';
import { useEditorProject } from '../../../EditorContext';
import { useScene } from '../SceneContext';

export function PlaceSection() {
  const { scene } = useScene();
  const { project, updateProject, openModal } = useEditorProject();
  const { places } = project.cartridge;

  const handleUpdateScene = (updates: Partial<Scene>) => {
    updateProject(
      (draft) => {
        const sceneIndex = draft.cartridge.scenes.findIndex((s) => s.uuid === scene.uuid);
        if (sceneIndex !== -1) {
          draft.cartridge.scenes[sceneIndex] = {
            ...draft.cartridge.scenes[sceneIndex],
            ...updates,
          };
        }
      },
      {
        message: 'updated scene place',
        context: JSON.stringify({ sceneId: scene.uuid, updates }),
      },
    );
  };

  const selectedPlace = places.find((place) => place.uuid === scene.placeId);

  const handlePlaceSelect = (place: Place) => {
    handleUpdateScene({ placeId: place.uuid });
  };

  const handleCreateNew = (name: string) => {
    const newPlace = {
      uuid: generatePlaceUuid(),
      name,
      description: '',
      sprites: {
        [DEFAULT_SPRITE_ID]: {
          imageUrl: '',
        },
      },
    };

    // Only create the place in cartridge, don't assign to scene yet
    updateProject(
      (draft) => {
        draft.cartridge.places.push(newPlace);
      },
      {
        message: 'created place',
        context: JSON.stringify({ place: newPlace }),
      },
    );

    // Auto-open edit modal for immediate configuration
    // Pass sceneId so it can be assigned to scene on save (not cancel/delete)
    openModal('editPlace', {
      uuid: newPlace.uuid,
      placeData: newPlace,
      sceneId: scene.uuid, // Pass scene context for later association
      isNewlyCreated: true, // Flag to indicate this is a newly created entity
    } as EditPlaceModalData);
  };

  const handleClearPlace = () => {
    handleUpdateScene({ placeId: undefined });
  };

  const handleEditPlace = () => {
    if (selectedPlace) {
      openModal('editPlace', {
        uuid: selectedPlace.uuid,
        placeData: selectedPlace,
      });
    }
  };

  return (
    <div>
      <HelpLabel
        label="Place"
        tips={[
          {
            type: 'prompt',
            tooltip:
              'The AI narrator will be given this description. Use this to include extra context or instructions.',
          },
        ]}
      />
      <div className="flex flex-col gap-2 p-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
        <div className="flex flex-col gap-2">
          <SearchableDropdown<Place>
            placeholder="Search places or type to create new..."
            emptyStateText="No places created yet"
            noResultsText="No places found"
            items={places}
            selectedItem={selectedPlace}
            getItemId={(place: Place) => place.uuid}
            getItemName={(place: Place) => place.name}
            getItemDescription={(place: Place) => place.description}
            filterItems={(items: Place[], searchValue: string) =>
              items.filter(
                (place: Place) =>
                  place.name.toLowerCase().includes(searchValue.toLowerCase()) &&
                  place.uuid !== selectedPlace?.uuid,
              )
            }
            renderSelectedDisplay={(selectedItem: Place | undefined, onClick: () => void) => (
              <div className="flex gap-2 items-center">
                <div className="flex-1 relative">
                  <button
                    type="button"
                    onClick={onClick}
                    className="w-full p-2 rounded-lg text-left flex items-center justify-between relative overflow-hidden cursor-pointer bg-slate-200 dark:bg-slate-800"
                  >
                    {selectedItem && getSprite(selectedItem).imageUrl && (
                      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none">
                        <div className="relative w-full h-full">
                          <Image
                            src={getSprite(selectedItem).imageUrl}
                            alt={`${selectedItem.name} background`}
                            fill
                            unoptimized
                            className="object-cover opacity-80"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-200/80 to-transparent dark:from-slate-800 dark:via-slate-800/80 dark:to-transparent" />
                        </div>
                      </div>
                    )}
                    <span
                      className={`relative z-[1] ${
                        selectedItem
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {selectedItem?.name || 'Select or create a place'}
                    </span>
                  </button>
                </div>

                {selectedItem && (
                  <Button variant="icon" onClick={handleEditPlace} className="flex-shrink-0">
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
            renderItemOption={(place: Place, isHighlighted: boolean, onClick: () => void) => (
              <button
                key={place.uuid}
                type="button"
                onClick={onClick}
                className={twMerge(
                  'w-full p-3 text-left border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer',
                  isHighlighted
                    ? 'bg-slate-100 dark:bg-slate-700'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden flex-shrink-0">
                    {!getSprite(place).imageUrl ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="w-4 h-4 text-slate-500" />
                      </div>
                    ) : (
                      <Image
                        src={getSprite(place).imageUrl}
                        alt={`${place.name} thumbnail`}
                        width={32}
                        height={32}
                        unoptimized
                        loading="lazy"
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate line-clamp-1">{place.name}</div>
                    {place.description && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate line-clamp-1">
                        {place.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )}
            onItemSelect={handlePlaceSelect}
            onCreateNew={handleCreateNew}
            onClear={handleClearPlace}
            allowCreate={true}
            allowClear={true}
            multiSelect={false}
          />
          {selectedPlace && selectedPlace.description && (
            <p className="text-sm px-1 text-slate-500 dark:text-slate-400 line-clamp-1">
              {selectedPlace.description}
            </p>
          )}
        </div>
        <hr className="border-slate-300 dark:border-slate-700" />
        <Textarea
          value={scene.prompt || ''}
          onChange={(p) => handleUpdateScene({ prompt: p })}
          placeholder="Describe what else is happening in this scene (e.g. characters fighting over the bill)"
        />
      </div>
    </div>
  );
}
