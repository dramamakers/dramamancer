import Button from '@/components/Button';
import { formatSceneTitle } from '@/utils/format';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { DragEvent, useState } from 'react';
import { useEditorProject } from '../../EditorContext';

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView();
  }
};

export default function TableOfContents({
  isOpen,
  close,
  openEditorView,
}: {
  isOpen: boolean;
  close: () => void;
  openEditorView: () => void;
}) {
  const { project, updateProject } = useEditorProject();
  const { scenes } = project.cartridge;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const reorderScenes = (fromIndex: number, toIndex: number) => {
    const newScenes = [...scenes];
    const [movedScene] = newScenes.splice(fromIndex, 1);
    newScenes.splice(toIndex, 0, movedScene);

    updateProject(
      (draft) => {
        draft.cartridge.scenes = newScenes;
        // Always set the first scene as the starting scene
        if (newScenes.length > 0) {
          draft.settings.startingSceneId = newScenes[0].uuid;
        }
      },
      {
        message: 'reordered scenes',
        context: JSON.stringify({
          fromIndex,
          toIndex,
          newStartingSceneId: newScenes[0]?.uuid,
        }),
      },
    );
  };

  const handleDragStart = (e: DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderScenes(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const onClickSection = (sectionId: string) => {
    openEditorView();
    setTimeout(() => {
      scrollToSection(sectionId);
    }, 100);
  };

  const content = (
    <div className="flex flex-col text-left justify-start items-start gap-1 w-full max-w-xs">
      <button
        onClick={() => onClickSection('style')}
        className={`font-medium cursor-pointer hover:text-slate-500 transition-colors`}
      >
        Style
      </button>
      <button
        onClick={() => onClickSection('characters')}
        className={`font-medium cursor-pointer hover:text-slate-500 transition-colors`}
      >
        Characters
      </button>
      <div className="flex flex-col w-full">
        {project.cartridge.characters.map((character) => (
          <div
            key={character.uuid}
            onClick={() => onClickSection(`characters`)}
            className={`cursor-pointer hover:text-slate-500 transition-colors ml-5 line-clamp-1`}
          >
            {character.name}
          </div>
        ))}
      </div>
      <button
        onClick={() => onClickSection('places')}
        className={`font-medium cursor-pointer hover:text-slate-500 transition-colors`}
      >
        Places
      </button>
      <div className="flex flex-col w-full">
        {project.cartridge.places.map((place) => (
          <div
            key={place.uuid}
            onClick={() => onClickSection(`places`)}
            className={`cursor-pointer hover:text-slate-500 transition-colors ml-5 line-clamp-1`}
          >
            {place.name}
          </div>
        ))}
      </div>
      <button
        onClick={() => onClickSection('scenes')}
        className={`font-medium cursor-pointer hover:text-slate-500 transition-colors`}
      >
        Scenes
      </button>
      <div className="flex flex-col w-full">
        {scenes.map((scene, index) => (
          <div
            key={index}
            className={`relative flex items-center group ${draggedIndex === index ? 'opacity-50' : ''} ${
              dragOverIndex === index ? 'border-t-2 border-blue-500' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle - only visible on hover */}
            <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
              <Bars3Icon className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </div>
            <button
              onClick={() => onClickSection(`scene-${scene.uuid}`)}
              className="ml-1 text-left cursor-pointer transition-colors flex-1 truncate hover:text-slate-500 p-1 flex items-center"
            >
              {formatSceneTitle(scene.title, index)}
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => onClickSection('publishing')}
        className={`font-medium cursor-pointer hover:text-slate-500 transition-colors`}
      >
        Publishing
      </button>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 xl:hidden" onClick={close} />}

      {/* Sidebar */}
      <div
        className={`fixed xl:relative bg-white dark:bg-slate-800 xl:bg-transparent! p-4 xl:p-0 top-0 left-0 h-full z-40 xl:transform-none transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
        }`}
      >
        <div className="flex justify-end mb-4 xl:hidden">
          <Button className="p-2" onClick={close}>
            <XMarkIcon className="w-6 h-6" />
          </Button>
        </div>
        {content}
      </div>
    </>
  );
}
