import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { CharacterIcon } from '@/app/editor/components/CharacterIcon';
import { Character, DisplayLine, Scene } from '@/app/types';
import Button from '@/components/Button';
import CollapsibleCard from '@/components/CollapsibleCard';
import Textarea from '@/components/Textarea';
import { useTooltip } from '@/components/Tooltip';
import { Bars3Icon, TrashIcon } from '@heroicons/react/24/outline';
import CharacterDropdown from '../../../CharacterDropdown';

export default function ScriptLine({
  line,
  lineIndex,
  scene,
  onRemove,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  line: DisplayLine;
  lineIndex: number;
  scene: Scene;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const { project, updateProject } = useEditorProject();
  const { showTooltip, hideTooltip } = useTooltip();
  const { characters } = project.cartridge;

  const character =
    line.type === 'narration'
      ? null
      : line.characterId
        ? characters.find((c) => c.uuid === line.characterId) || null
        : characters.find((c) => c.name === line.characterName) || null;

  const handleUpdateLine = (updates: Partial<DisplayLine>) => {
    updateProject((draft) => {
      const sceneIndex = draft.cartridge.scenes.findIndex((s) => s.uuid === scene.uuid);
      if (sceneIndex !== -1) {
        draft.cartridge.scenes[sceneIndex].script![lineIndex] = { ...line, ...updates };
      }
    });
  };

  const handleCharacterSelect = (selectedCharacter: Character) => {
    handleUpdateLine({
      characterId: selectedCharacter.uuid,
      characterName: selectedCharacter.name,
      type: 'character',
    });
  };

  const handleClearCharacter = () => {
    handleUpdateLine({
      characterId: undefined,
      characterName: undefined,
      type: 'narration',
    });
  };

  const headerContent = (
    <div className="flex items-center gap-4">
      <div
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          onDragStart();
        }}
        onDragEnd={onDragEnd}
      >
        <Bars3Icon className="w-5 h-5" />
      </div>
      <CharacterIcon character={character} className="w-10 h-10" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">
          {line.type === 'narration'
            ? 'Narrator'
            : character?.name || line.characterName || 'Unknown'}
        </div>
        <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
          {line.text === '' ? (
            <span className="opacity-50">
              Click to set up this {line.type === 'narration' ? 'narration' : 'dialogue'}
            </span>
          ) : (
            line.text
          )}
        </p>
      </div>
    </div>
  );

  const deleteAction = (
    <Button
      variant="icon"
      className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-600 hover:text-red-500 cursor-pointer transition-opacity"
      onMouseOver={() => showTooltip('Delete line')}
      onMouseOut={hideTooltip}
      onClick={(e) => {
        e.stopPropagation();
        hideTooltip();
        if (window.confirm('Are you sure you want to delete this line?')) {
          onRemove();
        }
      }}
    >
      <TrashIcon className="w-4 h-4" />
    </Button>
  );

  return (
    <div className={`${isDragging ? 'opacity-50' : ''}`}>
      <CollapsibleCard header={headerContent} actions={deleteAction}>
        {/* Character Selection */}
        <CharacterDropdown
          scene={scene}
          characters={characters}
          selectedCharacter={character || undefined}
          onSelect={handleCharacterSelect}
          onClear={handleClearCharacter}
          allowClear={true}
          multiSelect={false}
        />

        {/* Text Input */}
        <Textarea
          value={line.text}
          onChange={(text) => handleUpdateLine({ text })}
          placeholder="Enter dialogue or narration..."
          rows={3}
          maxLength={2000}
          className="bg-white! dark:bg-slate-900!"
        />
      </CollapsibleCard>
    </div>
  );
}
