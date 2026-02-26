import { PlusIcon } from '@heroicons/react/24/outline';
import { useEditorProject } from '../../EditorContext';
import { PlaceCard } from './PlaceCard';

export function PlacesList() {
  const { project, openModal } = useEditorProject();
  const places = project.cartridge.places || [];

  const handleOpenModal = (placeUuid?: string) => {
    if (placeUuid) {
      openModal('editPlace', {
        uuid: placeUuid,
        placeData: places.find((place) => place.uuid === placeUuid)!,
      });
      return;
    }
    openModal('createPlace');
  };

  return (
    <div>
      <h1 id="places">Places</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Create and manage the places that will appear in your game.
      </p>
      <div className="flex flex-wrap gap-2 pt-4">
        {places.map((place) => (
          <PlaceCard key={place.uuid} place={place} />
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
