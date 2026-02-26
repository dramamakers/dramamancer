
import Button from '@/components/Button';
import { useTooltip } from '@/components/Tooltip';
import { useToastStore } from '@/store/toast';
import { validateImageUrl } from '@/utils/validate';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DragEvent, useCallback, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useEditorProject } from '../[projectId]/EditorContext';
import { ImageSelectModalData } from './Modals/types';

export default function SpriteCard({
  imageSelectModalProps,
  children,
  className,
  hasImage,
  placeholderText = 'Drag and drop an image URL, or click to add an image.',
  disabled = false,
}: {
  imageSelectModalProps: ImageSelectModalData;
  children: React.ReactNode;
  className?: string;
  hasImage: boolean;
  placeholderText?: string;
  disabled?: boolean;
}) {
  const { openModal } = useEditorProject();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const { addToast } = useToastStore();
  const { showTooltip, hideTooltip } = useTooltip();

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      if (disabled) return;

      try {
        const url = validateImageUrl(e);
        imageSelectModalProps.updateEntity?.({ imageUrl: url });
      } catch (error) {
        addToast(error instanceof Error ? error.message : 'Invalid image URL');
      }
    },
    [addToast, imageSelectModalProps, disabled],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) {
        setIsDraggingOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const dropProps = useMemo(
    () => ({
      onDrop: handleDrop,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
    }),
    [handleDrop, handleDragOver, handleDragLeave],
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      hideTooltip();
      if (confirm('Are you sure you want to delete this image?')) {
        imageSelectModalProps.updateEntity?.({ imageUrl: '' });
      }
    },
    [hideTooltip, imageSelectModalProps],
  );

  const handleMouseOver = useCallback(() => {
    showTooltip('Clear image');
  }, [showTooltip]);

  return (
    <div
      {...dropProps}
      className={twMerge(
        'relative group/image-card rounded-lg overflow-hidden min-h-24 bg-slate-200 dark:bg-slate-700',
        disabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
    >
      {isDraggingOver && (
        <div
          className={twMerge(
            'absolute inset-0 z-[1] bg-blue-500/40 border-2 border-blue-600 border-dashed flex items-center justify-center backdrop-brightness-75',
          )}
        />
      )}
      {!disabled && (
        <div className="absolute z-[1] inset-0 bg-black/0 group-hover/image-card:bg-black/50 transition-colors rounded-lg flex items-center justify-center">
          <Button
            variant="primary"
            className="opacity-0 group-hover/image-card:opacity-100 transition-opacity"
            onClick={() => {
              openModal('selectImage', {
                ...imageSelectModalProps,
              } as ImageSelectModalData);
            }}
          >
            {hasImage ? 'Replace image' : 'Add image'}
          </Button>
        </div>
      )}
      {children}
      {!hasImage ? (
        <div className="flex flex-col items-center justify-center p-5 gap-2 select-none h-full w-full">
          <PhotoIcon className="w-10 h-10 text-slate-500" />
          {placeholderText && (
            <p className="text-sm text-slate-500 italic text-center whitespace-pre-line">
              {placeholderText}
            </p>
          )}
        </div>
      ) : (
        !disabled && (
          <div className="absolute top-0 right-0 opacity-0 group-hover/image-card:opacity-100 z-[1] m-2 flex gap-1">
            <Button
              variant="icon-filled"
              className="p-2"
              onMouseOver={handleMouseOver}
              onMouseOut={hideTooltip}
              onClick={handleDeleteClick}
            >
              <TrashIcon className="w-5 h-5" />
            </Button>
          </div>
        )
      )}
    </div>
  );
}
