import Button from '@/components/Button';
import { CheckIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

export default function EditableTitle({
  title,
  onSave,
  className,
  actions,
  variant = 'left',
  placeholder = 'Untitled',
}: {
  title: string;
  onSave: (title: string) => void;
  className?: string;
  actions?: React.ReactNode;
  variant?: 'left' | 'right';
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleSave = () => {
    onSave(tempTitle);
    setIsEditing(false);
  };

  return (
    <div className={twMerge('flex w-full gap-1', variant === 'right' && 'text-right', className)}>
      <div
        className={twMerge(
          'flex gap-1 truncate items-center w-full',
          variant === 'right' && 'justify-end',
        )}
      >
        {isEditing ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
            onBlur={handleSave}
            className={twMerge('min-w-80 text-lg p-0!', variant === 'right' && 'text-right')}
            placeholder={placeholder}
            autoFocus
          />
        ) : (
          <p className="text-lg font-normal truncate">
            {title || <span className="text-slate-500">{placeholder}</span>}
          </p>
        )}
        <Button
          variant="icon"
          onClick={(e) => {
            e.preventDefault();
            if (isEditing) {
              handleSave();
            } else {
              setTempTitle(title);
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? <CheckIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
        </Button>
      </div>
      <div>{actions}</div>
    </div>
  );
}
