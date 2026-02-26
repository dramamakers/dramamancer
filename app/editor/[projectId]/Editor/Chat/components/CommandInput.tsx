'use client';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

// Available commands
const COMMANDS = [
  {
    name: '/create',
    description: 'Create a new game from scratch',
    icon: SparklesIcon,
    color: 'emerald',
  },
  // You can easily add more commands here in the future:
  // {
  //   name: '/edit',
  //   description: 'Make changes to your current game',
  //   icon: PencilIcon,
  //   color: 'blue',
  // },
] as const;

export interface CommandChip {
  id: string;
  command: (typeof COMMANDS)[number];
}

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  commands?: CommandChip[];
  onCommandsChange?: (commands: CommandChip[]) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CommandInput = forwardRef<HTMLTextAreaElement, CommandInputProps>(
  (
    {
      value,
      onChange,
      commands = [],
      onCommandsChange,
      onKeyDown,
      placeholder,
      disabled,
      className,
    },
    ref,
  ) => {
    const [showCommandMenu, setShowCommandMenu] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose the textarea ref to parent
    useImperativeHandle(ref, () => textareaRef.current!);

    // Detect when user types '/' or '\' and show command menu
    useEffect(() => {
      const trimmedValue = value.trim();

      // Show menu if input starts with '/' or '\' (both work as command prefix)
      const shouldShowMenu =
        trimmedValue === '/' ||
        trimmedValue === '\\' ||
        trimmedValue.startsWith('/ ') ||
        trimmedValue.startsWith('\\ ');

      setShowCommandMenu(shouldShowMenu);
    }, [value]);

    // Handle command selection from menu
    const handleCommandSelect = (commandName: string) => {
      const command = COMMANDS.find((cmd) => cmd.name === commandName);
      if (!command) return;

      // Create a new chip
      const newChip: CommandChip = {
        id: `${Date.now()}-${Math.random()}`,
        command,
      };

      // Add to commands array
      onCommandsChange?.([...commands, newChip]);

      // Clear the input (remove the '/')
      onChange('');
      setShowCommandMenu(false);

      // Refocus textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    };

    // Handle chip removal
    const handleRemoveChip = (chipId: string) => {
      onCommandsChange?.(commands.filter((c) => c.id !== chipId));
    };

    // Handle backspace at the beginning of input to remove last chip
    const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Close menu on Escape
      if (e.key === 'Escape' && showCommandMenu) {
        setShowCommandMenu(false);
        e.preventDefault();
        return;
      }

      // Select first command on Tab
      if (e.key === 'Tab' && showCommandMenu && COMMANDS.length > 0) {
        e.preventDefault();
        handleCommandSelect(COMMANDS[0].name);
        return;
      }

      // Remove last chip on backspace when textarea is empty
      if (e.key === 'Backspace' && value === '' && commands.length > 0) {
        e.preventDefault();
        onCommandsChange?.(commands.slice(0, -1));
        return;
      }

      // Auto-resize textarea
      if (textareaRef.current) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          }
        }, 0);
      }

      onKeyDown?.(e);
    };

    return (
      <div ref={containerRef} className="relative w-full">
        {/* Container with chips and textarea */}
        <div className={twMerge('flex flex-wrap items-center gap-2 min-h-[40px]', className)}>
          {/* Command chips */}
          {commands.map((chip) => {
            const Icon = chip.command.icon;
            return (
              <div
                key={chip.id}
                className={twMerge(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium',
                  'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
                  'border border-emerald-300 dark:border-emerald-700',
                  'animate-in fade-in zoom-in duration-200',
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{chip.command.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveChip(chip.id)}
                  disabled={disabled}
                  className={twMerge(
                    'ml-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded p-0.5',
                    'transition-colors',
                    disabled && 'opacity-50 cursor-not-allowed',
                  )}
                  aria-label="Remove command"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Textarea - grows to fill remaining space */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDownInternal}
            placeholder={commands.length === 0 ? placeholder : undefined}
            disabled={disabled}
            className={twMerge(
              'flex-1 min-w-[200px] resize-none overflow-hidden focus:outline-none bg-transparent',
              'text-slate-900 dark:text-slate-100',
            )}
            rows={1}
            style={{
              minHeight: '24px',
            }}
          />
        </div>

        {/* Command suggestion menu */}
        {showCommandMenu && (
          <div
            className="absolute z-50 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              bottom: '100%',
              left: 0,
              marginBottom: '8px',
              minWidth: '300px',
            }}
          >
            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              Commands
            </div>
            {COMMANDS.map((command) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.name}
                  type="button"
                  className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCommandSelect(command.name);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div
                    className={twMerge(
                      'flex items-center justify-center w-9 h-9 rounded-lg',
                      'bg-emerald-100 dark:bg-emerald-900/40',
                    )}
                  >
                    <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {command.name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {command.description}
                    </div>
                  </div>
                  <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded">
                    Tab
                  </kbd>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

CommandInput.displayName = 'CommandInput';

export default CommandInput;
