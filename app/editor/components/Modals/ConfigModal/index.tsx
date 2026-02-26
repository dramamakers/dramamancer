import { EditableProject, Project } from '@/app/types';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Textarea from '@/components/Textarea';
import { validate } from '@/utils/validate';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { CURRENT_PROJECT_VERSION, useEditorProject } from '../../../[projectId]/EditorContext';

const getEditableProject = (project: Project): EditableProject => {
  return {
    title: project.title,
    settings: project.settings,
    cartridge: project.cartridge,
  };
};

export function ConfigModal() {
  const { project, updateProject, closeModal, activeModal } = useEditorProject();
  const [error, setError] = useState<string | null>(null);
  const [json, setJson] = useState<EditableProject | null>(null);
  const [jsonText, setJsonText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (project) {
      const editableProject = getEditableProject(project);
      setJson(editableProject);
      handleSetJsonText(JSON.stringify(editableProject, null, 2));
    }
  }, [project]);

  const handleSetJsonText = (text: string) => {
    try {
      setJsonText(text);
      const parsed = JSON.parse(text);
      const validationError = validate(parsed);
      if (validationError) {
        setError(validationError);
      } else {
        setJson(parsed);
        setError(null);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid JSON format';
      setError(errorMessage);
    }
  };

  const handleSave = async () => {
    if (!json) return;
    updateProject(
      {
        ...project,
        ...json,
        version: CURRENT_PROJECT_VERSION,
        updatedAt: Date.now(),
      },
      {
        message: 'edited cartridge',
        context: jsonText,
      },
    );
    closeModal();
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story.json';
    a.click();
  };

  const getIndentation = (text: string, cursorPos: number): number => {
    const lines = text.substring(0, cursorPos).split('\n');
    const currentLine = lines[lines.length - 1];
    const indentation = currentLine.match(/^\s*/)?.[0].length || 0;
    return indentation;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const indentation = getIndentation(jsonText, start);
      const spaces = ' '.repeat(indentation);

      const lineStart = jsonText.lastIndexOf('\n', start) + 1;
      const lineText = jsonText.substring(lineStart, start);
      const isAfterColon = lineText.includes(':');

      e.preventDefault();
      const newText =
        jsonText.substring(0, start) +
        '\n' +
        spaces +
        (isAfterColon ? '  ' : '') +
        jsonText.substring(start);

      setJsonText(newText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 1 + spaces.length + (isAfterColon ? 2 : 0);
          textareaRef.current.selectionEnd = start + 1 + spaces.length + (isAfterColon ? 2 : 0);
        }
      }, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== end) {
        const lines = jsonText.split('\n');
        const startLine = jsonText.substring(0, start).split('\n').length - 1;
        const endLine = jsonText.substring(0, end).split('\n').length - 1;

        for (let i = startLine; i <= endLine; i++) {
          lines[i] = '  ' + lines[i];
        }

        const newText = lines.join('\n');
        setJsonText(newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 2;
            textareaRef.current.selectionEnd = end + (endLine - startLine + 1) * 2;
          }
        }, 0);
      } else {
        const newText = jsonText.substring(0, start) + '  ' + jsonText.substring(end);
        setJsonText(newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 2;
            textareaRef.current.selectionEnd = start + 2;
          }
        }, 0);
      }
    }
  };

  const handleUpload = () => {
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json';
    file.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const parsed = JSON.parse(text);
          const textAsJson: EditableProject = {
            title: parsed.title || project?.title,
            settings: parsed.settings || project?.settings,
            cartridge: parsed.cartridge || project?.cartridge,
          };
          handleSetJsonText(JSON.stringify(textAsJson, null, 2));
        };
        reader.readAsText(file);
      }
    };
    file.click();
  };

  return (
    <Modal
      isOpen={activeModal !== null && activeModal.modal === 'config'}
      onClose={closeModal}
      title="Cartridge editor"
      actions={
        <div className="flex gap-2 w-full justify-between items-center mb-2">
          <div className="flex gap-2">
            <Button onClick={handleUpload} className="w95 px-2 flex items-center gap-2">
              <ArrowUpTrayIcon className="w-4 h-4" /> Replace cartridge
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="w95 px-2 flex items-center gap-2">
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </Button>
            <Button
              onClick={handleSave}
              className="w95 px-2 flex items-center gap-2"
              disabled={!jsonText || !!error}
            >
              Save and close
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <p className="text-red-500">{error}</p>}
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Copy and paste previous projects into this editor to restore them, or edit your game
          directly here. All cartridges must be in a valid JSON format.
        </p>
        <div className="flex flex-col flex-1">
          <Textarea
            ref={textareaRef}
            value={jsonText}
            onChange={(value) => handleSetJsonText(value)}
            onKeyDown={handleKeyDown}
            className="font-mono text-xs bg-slate-200! dark:bg-slate-800! rounded-lg h-[calc(80vh-200px)]!"
            style={{ tabSize: 2 }}
          />
        </div>
      </div>
    </Modal>
  );
}
