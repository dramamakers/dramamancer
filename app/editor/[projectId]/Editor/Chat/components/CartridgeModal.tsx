import { Cartridge, Character, DisplayLine } from '@/app/types';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatSceneTitle } from '@/utils/format';
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

interface CartridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: Cartridge | null;
  projectTitle?: string;
  readonly?: boolean;
  onCartridgeUpdate?: (cartridge: Cartridge) => void;
}

interface HierarchyNodeProps {
  label: string;
  children?: React.ReactNode;
  icon?: string;
  count?: number;
  defaultExpanded?: boolean;
  editable?: boolean;
  value?: string | number;
  onEdit?: (newValue: string | number) => void;
  valueType?: 'string' | 'number';
  multiline?: boolean;
  showAddButton?: boolean;
  onAdd?: () => void;
  addButtonTitle?: string;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  removeButtonTitle?: string;
}

function HierarchyNode({
  label,
  children,
  icon,
  count,
  defaultExpanded = false,
  editable = false,
  value,
  onEdit,
  valueType = 'string',
  multiline = false,
  showAddButton = false,
  onAdd,
  addButtonTitle,
  showRemoveButton = false,
  onRemove,
  removeButtonTitle,
}: HierarchyNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasChildren = children !== undefined;

  useEffect(() => {
    setEditValue(value?.toString() || '');
  }, [value]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editable && !isEditing) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value?.toString() || '');
    }
  };

  const handleSave = () => {
    if (onEdit) {
      const newValue = valueType === 'number' ? parseFloat(editValue) : editValue;
      if (valueType === 'number' && isNaN(newValue as number)) {
        setEditValue(value?.toString() || '');
        setIsEditing(false);
        return;
      }
      onEdit(newValue);
    }
    setIsEditing(false);
  };

  const handleBlur = () => {
    handleSave();
  };

  const renderValue = () => {
    if (editable && isEditing) {
      if (multiline) {
        return (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="bg-white dark:bg-slate-800 border border-blue-500 rounded px-2 py-1 text-sm font-mono min-w-0 flex-1 resize-y"
            rows={Math.min(Math.max(3, editValue.split('\n').length), 20)}
            style={{ minWidth: '200px' }}
            placeholder="Enter script lines (Cmd/Ctrl+Enter to save)"
          />
        );
      }
      return (
        <input
          ref={inputRef}
          type={valueType === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="bg-white dark:bg-slate-800 border border-blue-500 rounded px-1 py-0 text-sm font-mono min-w-0 flex-1"
          style={{ minWidth: '60px' }}
        />
      );
    }

    return (
      <span
        className={`text-sm font-mono ${editable ? 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 px-1 rounded' : ''} ${multiline ? 'whitespace-pre-wrap' : ''}`}
        onDoubleClick={handleDoubleClick}
        title={editable ? 'Double-click to edit' : undefined}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="select-none">
      <div
        className={`flex ${multiline && isEditing ? 'flex-col items-start' : 'items-center'} gap-2 py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${hasChildren && !isEditing ? 'cursor-pointer' : ''}`}
        onClick={hasChildren && !isEditing ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div
          className={`flex items-center gap-2 ${multiline && isEditing ? 'w-full' : 'flex-1 min-w-0'}`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
            )
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}
          {icon && <span className="text-sm flex-shrink-0">{icon}</span>}
          <div className={multiline && isEditing ? 'w-full' : 'flex-1 min-w-0'}>
            {renderValue()}
          </div>
          {count !== undefined && (
            <span className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {showRemoveButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
              title={removeButtonTitle || 'Remove item'}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
          {showAddButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.();
              }}
              className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400"
              title={addButtonTitle || 'Add item'}
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-6 border-l border-slate-200 dark:border-slate-600 pl-2">{children}</div>
      )}
    </div>
  );
}

function CharacterSelector({
  isOpen,
  onClose,
  characters,
  excludeIds,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  excludeIds: string[];
  onSelect: (characterId: string) => void;
}) {
  const availableCharacters = characters.filter((char) => !excludeIds.includes(char.uuid));
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg min-w-[200px]">
      <div className="p-2">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Add Character to Scene
        </div>
        {availableCharacters.length === 0 ? (
          <div className="text-sm text-slate-500 p-2">All characters are already in this scene</div>
        ) : (
          <div className="space-y-1">
            {availableCharacters.map((character) => (
              <button
                key={character.uuid}
                onClick={() => {
                  onSelect(character.uuid);
                  onClose();
                }}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-100 dark:hover:bg-blue-900 focus:outline-none focus:bg-blue-100 dark:focus:bg-blue-900"
              >
                {character.name}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-2 w-full px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CartridgeHierarchy({
  cartridge,
  onCartridgeUpdate,
  readonly,
}: {
  cartridge: Cartridge;
  onCartridgeUpdate?: (cartridge: Cartridge) => void;
  readonly?: boolean;
}) {
  const [selectorState, setSelectorState] = useState<{
    isOpen: boolean;
    sceneIndex: number | null;
  }>({ isOpen: false, sceneIndex: null });

  const updateCartridge = (updater: (cartridge: Cartridge) => Cartridge) => {
    if (onCartridgeUpdate && !readonly) {
      const newCartridge = updater({ ...cartridge });
      onCartridgeUpdate(newCartridge);
    }
  };

  const updateScene = (
    sceneIndex: number,
    field: string,
    value: string | number | string[] | DisplayLine[],
  ) => {
    updateCartridge((cart) => ({
      ...cart,
      scenes: cart.scenes.map((scene, idx) =>
        idx === sceneIndex ? { ...scene, [field]: value } : scene,
      ),
    }));
  };

  const updateCharacter = (charIndex: number, field: string, value: string | number) => {
    updateCartridge((cart) => ({
      ...cart,
      characters: cart.characters.map((char, idx) =>
        idx === charIndex ? { ...char, [field]: value } : char,
      ),
    }));
  };

  const updatePlace = (placeIndex: number, field: string, value: string | number) => {
    updateCartridge((cart) => ({
      ...cart,
      places: cart.places.map((place, idx) =>
        idx === placeIndex ? { ...place, [field]: value } : place,
      ),
    }));
  };

  const updateStyle = (field: string, value: string | number) => {
    updateCartridge((cart) => ({
      ...cart,
      style: { ...cart.style, [field]: value },
    }));
  };

  const updateTrigger = (
    sceneIndex: number,
    triggerIndex: number,
    field: string,
    value: string | number | string[],
  ) => {
    updateCartridge((cart) => ({
      ...cart,
      scenes: cart.scenes.map((scene, sIdx) =>
        sIdx === sceneIndex
          ? {
              ...scene,
              triggers: scene.triggers.map((trigger, tIdx) =>
                tIdx === triggerIndex ? { ...trigger, [field]: value } : trigger,
              ),
            }
          : scene,
      ),
    }));
  };

  // Helper function to get character name by ID
  const getCharacterName = (uuid: string) => {
    const character = cartridge.characters.find((c) => c.uuid === uuid);
    return character ? character.name : `Character ${uuid}`;
  };

  const addCharacterToScene = (sceneIndex: number, characterId: string) => {
    const scene = cartridge.scenes[sceneIndex];
    if (!scene.characterIds.includes(characterId)) {
      const newCharacterIds = [...scene.characterIds, characterId];
      updateScene(sceneIndex, 'characterIds', newCharacterIds);
    }
  };

  const removeCharacterFromScene = (sceneIndex: number, characterIndex: number) => {
    const scene = cartridge.scenes[sceneIndex];
    const newCharacterIds = scene.characterIds.filter((_, idx) => idx !== characterIndex);
    updateScene(sceneIndex, 'characterIds', newCharacterIds);
  };

  const handleAddCharacter = (sceneIndex: number) => {
    setSelectorState({ isOpen: true, sceneIndex });
  };

  const handleCharacterSelect = (characterId: string) => {
    if (selectorState.sceneIndex !== null) {
      addCharacterToScene(selectorState.sceneIndex, characterId);
    }
    setSelectorState({ isOpen: false, sceneIndex: null });
  };

  return (
    <div className="font-mono text-sm space-y-1 relative">
      <HierarchyNode label="cartridge" icon="📦" defaultExpanded>
        <HierarchyNode label="scenes" icon="🎬" count={cartridge.scenes.length} defaultExpanded>
          {cartridge.scenes.map((scene, index) => (
            <HierarchyNode
              key={index}
              label={`[${index}] ${formatSceneTitle(scene.title, index)}`}
              icon="🎭"
            >
              <HierarchyNode label={`uuid: "${scene.uuid}"`} editable={false} value={scene.uuid} />
              <HierarchyNode
                label={`title: "${scene.title}"`}
                editable={!readonly}
                value={scene.title}
                onEdit={(value) => updateScene(index, 'title', value)}
              />
              <HierarchyNode
                label={`placeId: "${scene.placeId || ''}"`}
                editable={!readonly}
                value={scene.placeId || ''}
                onEdit={(value) => updateScene(index, 'placeId', value)}
              />
              <HierarchyNode
                label="script"
                icon="📝"
                count={scene.script.length}
                showAddButton={!readonly}
                onAdd={() => {
                  const newScript = [...scene.script, { type: 'narration' as const, text: '' }];
                  updateScene(index, 'script', newScript);
                }}
                addButtonTitle="Add script line"
              >
                {scene.script.map((line, lineIdx) => (
                  <div key={lineIdx} className="flex items-start gap-2">
                    <div className="flex-1">
                      <HierarchyNode
                        label={`[${lineIdx}] ${line.characterId ? cartridge.characters.find((c) => c.uuid === line.characterId)?.name || line.characterName || 'Unknown' : line.characterName || ''}: ${line.text || '(empty)'}`}
                        editable={!readonly}
                        value={line.text}
                        showRemoveButton={!readonly}
                        onRemove={() => {
                          const newScript = scene.script.filter((_, idx) => idx !== lineIdx);
                          updateScene(index, 'script', newScript);
                        }}
                        removeButtonTitle="Remove script line"
                        onEdit={(value) => {
                          const newScript = scene.script.map((l, idx) =>
                            idx === lineIdx ? { ...l, text: value as string } : l,
                          );
                          updateScene(index, 'script', newScript);
                        }}
                      />
                    </div>
                    {!readonly && (
                      <select
                        value={line.characterId || ''}
                        onChange={(e) => {
                          const selectedCharacter = cartridge.characters.find(
                            (c) => c.uuid === e.target.value,
                          );
                          const newScript = scene.script.map((l, idx) =>
                            idx === lineIdx
                              ? {
                                  ...l,
                                  characterId: e.target.value || undefined,
                                  characterName: selectedCharacter?.name || undefined,
                                  type: e.target.value
                                    ? ('character' as const)
                                    : ('narration' as const),
                                }
                              : l,
                          );
                          updateScene(index, 'script', newScript);
                        }}
                        className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Narrator</option>
                        {cartridge.characters.map((char) => (
                          <option key={char.uuid} value={char.uuid}>
                            {char.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </HierarchyNode>
              <div className="relative">
                <HierarchyNode
                  label="characters"
                  icon="👥"
                  count={scene.characterIds.length}
                  showAddButton={!readonly}
                  onAdd={() => handleAddCharacter(index)}
                  addButtonTitle="Add character to scene"
                >
                  {scene.characterIds.map((id, idx) => (
                    <HierarchyNode
                      key={idx}
                      label={`[${idx}] ${getCharacterName(id)} (ID: ${id})`}
                      editable={!readonly}
                      value={id}
                      valueType="string"
                      showRemoveButton={!readonly}
                      onRemove={() => removeCharacterFromScene(index, idx)}
                      removeButtonTitle="Remove character from scene"
                      onEdit={(value) => {
                        const newCharacterIds = [...scene.characterIds];
                        newCharacterIds[idx] = value as string;
                        updateScene(index, 'characterIds', newCharacterIds);
                      }}
                    />
                  ))}
                </HierarchyNode>
                {selectorState.isOpen && selectorState.sceneIndex === index && (
                  <CharacterSelector
                    isOpen={true}
                    onClose={() => setSelectorState({ isOpen: false, sceneIndex: null })}
                    characters={cartridge.characters}
                    excludeIds={scene.characterIds}
                    onSelect={handleCharacterSelect}
                  />
                )}
              </div>
              <HierarchyNode label="triggers" icon="⚡" count={scene.triggers.length}>
                {scene.triggers.map((trigger, idx) => (
                  <HierarchyNode
                    key={idx}
                    label={`[${idx}] ${trigger.type}`}
                    icon={trigger.type === 'action' ? '🎯' : '🔄'}
                  >
                    {trigger.type === 'action' && (
                      <HierarchyNode
                        label={`condition: "${trigger.condition}"`}
                        editable={!readonly}
                        value={trigger.condition}
                        onEdit={(value) => updateTrigger(index, idx, 'condition', value)}
                      />
                    )}
                    <HierarchyNode
                      label={`narrative: "${trigger.narrative}"`}
                      editable={!readonly}
                      value={trigger.narrative}
                      onEdit={(value) => updateTrigger(index, idx, 'narrative', value)}
                    />
                    {trigger.goToSceneId !== undefined && (
                      <HierarchyNode
                        label={`goToSceneId: ${trigger.goToSceneId}`}
                        editable={!readonly}
                        value={trigger.goToSceneId}
                        valueType="number"
                        onEdit={(value) => updateTrigger(index, idx, 'goToSceneId', value)}
                      />
                    )}
                    {trigger.endingName && (
                      <HierarchyNode
                        label={`endingName: "${trigger.endingName}"`}
                        editable={!readonly}
                        value={trigger.endingName}
                        onEdit={(value) => updateTrigger(index, idx, 'endingName', value)}
                      />
                    )}
                    {trigger.type === 'action' && trigger.dependsOnTriggerIds && (
                      <HierarchyNode
                        label="dependsOnTriggerIds"
                        count={trigger.dependsOnTriggerIds.length}
                      >
                        {trigger.dependsOnTriggerIds.map((id, depIdx) => (
                          <HierarchyNode
                            key={depIdx}
                            label={`[${depIdx}] ${id}`}
                            editable={!readonly}
                            value={id}
                            valueType="string"
                            onEdit={(value) => {
                              const newDeps = [...(trigger.dependsOnTriggerIds || [])];
                              newDeps[depIdx] = value as string;
                              updateTrigger(index, idx, 'dependsOnTriggerIds', newDeps);
                            }}
                          />
                        ))}
                      </HierarchyNode>
                    )}
                  </HierarchyNode>
                ))}
              </HierarchyNode>
            </HierarchyNode>
          ))}
        </HierarchyNode>

        <HierarchyNode
          label="characters"
          icon="👤"
          count={cartridge.characters.length}
          defaultExpanded
        >
          {cartridge.characters.map((character, index) => (
            <HierarchyNode key={index} label={`[${index}] ${character.name}`} icon="👤">
              <HierarchyNode
                label={`uuid: "${character.uuid}"`}
                editable={false}
                value={character.uuid}
              />
              <HierarchyNode
                label={`name: "${character.name}"`}
                editable={!readonly}
                value={character.name}
                onEdit={(value) => updateCharacter(index, 'name', value)}
              />
              <HierarchyNode
                label={`description: "${character.description}"`}
                editable={!readonly}
                value={character.description}
                onEdit={(value) => updateCharacter(index, 'description', value)}
              />
            </HierarchyNode>
          ))}
        </HierarchyNode>

        <HierarchyNode label="places" icon="📍" count={cartridge.places.length} defaultExpanded>
          {cartridge.places.map((place, index) => (
            <HierarchyNode key={index} label={`[${index}] ${place.name}`} icon="📍">
              <HierarchyNode label={`uuid: "${place.uuid}"`} editable={false} value={place.uuid} />
              <HierarchyNode
                label={`name: "${place.name}"`}
                editable={!readonly}
                value={place.name}
                onEdit={(value) => updatePlace(index, 'name', value)}
              />
              <HierarchyNode
                label={`description: "${place.description}"`}
                editable={!readonly}
                value={place.description}
                onEdit={(value) => updatePlace(index, 'description', value)}
              />
            </HierarchyNode>
          ))}
        </HierarchyNode>

        <HierarchyNode label="style" icon="🎨" defaultExpanded>
          <HierarchyNode
            label={`prompt: "${cartridge.style.prompt}"`}
            editable={!readonly}
            value={cartridge.style.prompt}
            onEdit={(value) => updateStyle('prompt', value)}
          />
        </HierarchyNode>
      </HierarchyNode>
    </div>
  );
}

export default function CartridgeModal({
  isOpen,
  onClose,
  cartridge,
  projectTitle = 'Story',
  readonly = true,
  onCartridgeUpdate,
}: CartridgeModalProps) {
  const handleDownload = () => {
    if (!cartridge) return;
    const jsonText = JSON.stringify(cartridge, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.toLowerCase().replace(/\s+/g, '-')}-cartridge.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${projectTitle} - Cartridge`}
      actions={
        <div className="flex gap-2 w-full justify-end items-center mb-2">
          <Button onClick={handleDownload} className="px-4 flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Download
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {readonly
            ? "View your story's cartridge structure as a visual hierarchy. You can download the JSON or expand nodes to explore the structure."
            : "View and edit your story's cartridge structure. Double-click on any value to edit it. Use the + button to add characters to scenes, and the trash icon to remove them. Changes are applied immediately."}
        </p>
        <div className="flex flex-col flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 h-[calc(80vh-180px)] overflow-y-auto">
          {cartridge ? (
            <CartridgeHierarchy
              cartridge={cartridge}
              onCartridgeUpdate={onCartridgeUpdate}
              readonly={readonly}
            />
          ) : (
            <p className="text-slate-500 text-center">No cartridge data available</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
