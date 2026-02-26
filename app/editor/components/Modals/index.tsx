/* Modal provider */
import { ModalRegistry } from '@/app/editor/components/Modals/types';
import { useEditorProject } from '../../[projectId]/EditorContext';
import { CharacterModal } from './CharacterModal';
import { ConfigModal } from './ConfigModal';
import { ImageSelectModal } from './ImageSelectModal';
import { PlaceModal } from './PlaceModal';
import { ScriptLineModal } from './ScriptLineModal';
import SharingModal from './SharingModal';

// Modal registry - maps modal names to their components
const modalComponents: Record<keyof ModalRegistry, React.ComponentType> = {
  editCharacter: CharacterModal,
  createCharacter: CharacterModal,
  editPlace: PlaceModal,
  createPlace: PlaceModal,
  config: ConfigModal,
  selectImage: ImageSelectModal,
  sharing: SharingModal,
  createScriptLine: ScriptLineModal,
};

export default function Modals() {
  const { activeModal } = useEditorProject();

  // Only render the active modal
  if (!activeModal) {
    return null;
  }

  const ModalComponent = modalComponents[activeModal.modal];
  if (!ModalComponent) {
    return null;
  }

  return <ModalComponent />;
}
