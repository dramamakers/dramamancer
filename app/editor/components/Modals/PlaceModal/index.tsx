import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { deletePlaceById, updatePlaceById } from '@/app/editor/utils/edit';
import { EntityType } from '@/app/editor/utils/entity';
import { DEFAULT_SPRITE_ID, Place } from '@/app/types';
import Asset from '@/components/Asset';
import Button from '@/components/Button';
import HelpLabel from '@/components/Help';
import Modal from '@/components/Modal';
import Textarea from '@/components/Textarea';
import { getPlace, getSprite } from '@/utils/game';
import { generatePlaceUuid } from '@/utils/uuid';
import { useEffect, useState } from 'react';
import SpriteCard from '../../SpriteCard';
import { CreatePlaceModalData, EditPlaceModalData } from '../types';

const DEFAULT_PLACE: Place = {
  uuid: '',
  name: '',
  description: '',
  sprites: { [DEFAULT_SPRITE_ID]: { imageUrl: '' } },
};

export function PlaceModal() {
  const { activeModal, closeModal, openModal, project, updateProject } = useEditorProject();
  const mode = activeModal?.modal === 'editPlace' ? 'edit' : 'create';
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);

  // Initialize the place state based on the mode
  useEffect(() => {
    if (!activeModal?.data) {
      return;
    }

    if (mode === 'edit') {
      const data = activeModal.data as EditPlaceModalData;
      if (!data.uuid) {
        throw new Error('UUID is required');
      }
      setPlace({
        ...getPlace(project, data.uuid),
        ...(data.placeData && { ...data.placeData }),
      });
    } else if (mode === 'create') {
      const data = activeModal.data as CreatePlaceModalData;
      setPlace({
        ...DEFAULT_PLACE,
        ...(data.placeData && { ...data.placeData }),
      });
    }
  }, [mode, activeModal?.data, project]);

  const handleSavePlace = () => {
    if (mode === 'edit') {
      handleSave();
      return;
    }

    // Create mode
    const newPlace: Place = {
      ...place,
      uuid: generatePlaceUuid(),
    };
    updateProject(
      (draft) => {
        draft.cartridge.places.push(newPlace);
      },
      {
        message: 'created place',
        context: JSON.stringify({
          place: newPlace,
        }),
      },
    );
    closeModal();
  };

  const handleSave = () => {
    const modalData = activeModal?.data as EditPlaceModalData & {
      sceneId?: string;
      isNewlyCreated?: boolean;
    };

    updateProject((draft) => {
      updatePlaceById(draft, place.uuid, place);

      // If this is a newly created place from a scene dropdown, assign it to that scene
      if (modalData?.isNewlyCreated && modalData?.sceneId) {
        const sceneIndex = draft.cartridge.scenes.findIndex((s) => s.uuid === modalData.sceneId);
        if (sceneIndex !== -1) {
          draft.cartridge.scenes[sceneIndex].placeId = place.uuid;
        }
      }
    });
    closeModal();
  };

  function HeaderActions() {
    return (
      <div className="flex justify-between w-full gap-2">
        {mode === 'edit' && (
          <Button
            variant="link"
            onClick={() => {
              if (confirm('Are you sure you want to delete this place?')) {
                updateProject((draft) => {
                  deletePlaceById(draft, place.uuid);
                });
                closeModal();
              }
            }}
          >
            Delete
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Button onClick={closeModal}>Cancel</Button>
          <Button disabled={!place.name} onClick={handleSavePlace}>
            {mode === 'edit' ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal
      isOpen={
        activeModal !== null &&
        (activeModal.modal === 'editPlace' || activeModal.modal === 'createPlace')
      }
      onClose={closeModal}
      size="lg"
      title={mode === 'edit' ? 'Edit place' : 'Create new place'}
      actions={<HeaderActions />}
      className="flex flex-col gap-4"
    >
      <div className="flex gap-4">
        <div className="w-1/3 flex flex-col">
          <h2>Image</h2>
          <SpriteCard
            hasImage={getSprite(place).imageUrl !== ''}
            className="h-full"
            imageSelectModalProps={{
              type: EntityType.PLACE,
              entity: place,
              updateEntity: (updates: Partial<Place>) => {
                const updatedPlace: Place = {
                  ...place,
                  sprites: {
                    [DEFAULT_SPRITE_ID]: { ...getSprite(place), ...updates },
                  },
                };
                closeModal();
                if (mode === 'edit') {
                  openModal('editPlace', {
                    uuid: place.uuid,
                    placeData: updatedPlace,
                  });
                } else {
                  openModal('createPlace', { placeData: updatedPlace });
                }
              },
            }}
          >
            <Asset
              imageUrl={getSprite(place).imageUrl}
              alt="Place image"
              className="rounded-lg w-full h-full"
            />
          </SpriteCard>
        </div>
        <div className="w-2/3 flex flex-col gap-4">
          <div>
            <h2>Name</h2>
            <input
              type="text"
              value={place.name}
              onChange={(e) => setPlace({ ...place, name: e.target.value })}
              placeholder="Enter place name"
              className="w-full"
              maxLength={100}
            />
          </div>
          <div>
            <HelpLabel
              label="Description"
              tips={[
                {
                  type: 'private',
                  tooltip:
                    "The AI narrator will use this description to generate the place's dialogue and actions. The player cannot see this description.",
                },
              ]}
            />
            <Textarea
              value={place.description}
              onChange={(value) => setPlace({ ...place, description: value })}
              placeholder="Describe this place. What does it look like? What's the atmosphere?"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
