import { getCroppedSpriteStyle } from '@/app/constants';
import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { Character, DisplayLine } from '@/app/types';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Textarea from '@/components/Textarea';
import { getSprite } from '@/utils/game';
import { UserIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { CreateScriptLineModalData } from '../types';

export function ScriptLineModal() {
  const { activeModal, closeModal, project, updateProject } = useEditorProject();
  const { characters } = project.cartridge;

  const [newLineText, setNewLineText] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isVerbatim, setIsVerbatim] = useState(true);
  const [isCharacterDropdownOpen, setIsCharacterDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize modal state
  useEffect(() => {
    if (activeModal?.modal === 'createScriptLine' && activeModal.data) {
      // Reset form when modal opens
      setNewLineText('');
      setSelectedCharacter(null);
      setIsVerbatim(true);
      setIsCharacterDropdownOpen(false);

      // Focus textarea after modal opens
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [activeModal]);

  const handleSave = () => {
    if (!newLineText.trim()) return;

    const data = activeModal?.data as CreateScriptLineModalData;
    if (!data?.sceneUuid) return;

    const newLine: DisplayLine = {
      type: selectedCharacter ? 'character' : 'narration',
      text: newLineText.trim(),
      characterName: selectedCharacter ? selectedCharacter?.name : undefined,
      metadata: {
        verbatim: isVerbatim,
      },
    };

    updateProject(
      (draft) => {
        const sceneIndex = draft.cartridge.scenes.findIndex((s) => s.uuid === data.sceneUuid);
        if (sceneIndex !== -1) {
          if (!draft.cartridge.scenes[sceneIndex].script) {
            draft.cartridge.scenes[sceneIndex].script = [];
          }
          draft.cartridge.scenes[sceneIndex].script.push(newLine);
        }
      },
      {
        message: 'added script line',
        context: JSON.stringify({ sceneId: data.sceneUuid, line: newLine }),
      },
    );

    closeModal();
  };

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setIsCharacterDropdownOpen(false);
  };

  const handleNarratorSelect = () => {
    setSelectedCharacter(null);
    setIsCharacterDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCharacterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newLineText]);

  const isFormValid = newLineText.trim();
  function HeaderActions() {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={closeModal}>Cancel</Button>
        <Button onClick={handleSave} disabled={!isFormValid}>
          Add line
        </Button>
      </div>
    );
  }

  return (
    <Modal
      isOpen={activeModal?.modal === 'createScriptLine'}
      onClose={closeModal}
      size="md"
      title="Add a script line"
      actions={<HeaderActions />}
      className="flex flex-col gap-4 min-h-[400px]"
    >
      <div className="space-y-4">
        {/* Character/Narrator Selection */}
        <div className="relative" ref={dropdownRef}>
          <h2>Speaker</h2>
          <div
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
            onClick={() => setIsCharacterDropdownOpen(!isCharacterDropdownOpen)}
          >
            {selectedCharacter === null ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">N</span>
                </div>
                <span>Narrator</span>
              </div>
            ) : selectedCharacter ? (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded overflow-hidden relative">
                  {(() => {
                    const characterImageUrl = getSprite(selectedCharacter).imageUrl;
                    return !characterImageUrl ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-600">
                        <UserIcon className="w-4 h-4 text-slate-500" />
                      </div>
                    ) : (
                      <Image
                        src={characterImageUrl}
                        alt={`${selectedCharacter.name} avatar`}
                        width={100}
                        height={100}
                        unoptimized
                        style={{
                          ...getCroppedSpriteStyle(getSprite(selectedCharacter)),
                        }}
                      />
                    );
                  })()}
                </div>
                <span>{selectedCharacter.name}</span>
              </div>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">Select speaker...</span>
            )}
          </div>

          {isCharacterDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-[1]">
              <button
                type="button"
                onClick={handleNarratorSelect}
                className="w-full p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      N
                    </span>
                  </div>
                  <span>Narrator</span>
                </div>
              </button>
              {characters.map((character) => {
                const characterImageUrl = getSprite(character).imageUrl;
                return (
                  <button
                    key={character.uuid}
                    type="button"
                    onClick={() => handleCharacterSelect(character)}
                    className="w-full p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded overflow-hidden relative">
                        {!characterImageUrl ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-600">
                            <UserIcon className="w-4 h-4 text-slate-500" />
                          </div>
                        ) : (
                          <Image
                            src={characterImageUrl}
                            alt={`${character.name} avatar`}
                            width={100}
                            height={100}
                            unoptimized
                            style={{
                              ...getCroppedSpriteStyle(getSprite(character)),
                            }}
                          />
                        )}
                      </div>
                      <span>{character.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Text Input */}
        <div>
          <h2>Text</h2>
          <Textarea
            ref={textareaRef}
            value={newLineText}
            onChange={setNewLineText}
            placeholder="Enter the dialogue or narration..."
            className="w-full resize-none overflow-hidden min-h-[100px]"
            rows={3}
            maxLength={2000}
          />
        </div>
      </div>
    </Modal>
  );
}
