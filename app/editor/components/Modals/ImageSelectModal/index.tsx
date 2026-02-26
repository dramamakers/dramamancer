'use client';

import { EntityType } from '@/app/editor/utils/entity';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToastStore } from '@/store/toast';
import { useCallback, useState } from 'react';
import { useEditorProject } from '../../../[projectId]/EditorContext';
import { ImageSelectModalData } from '../types';

/**
 * Select an image via URL or local file upload.
 */
export function ImageSelectModal() {
  const { activeModal, closeModal } = useEditorProject();
  const modalData = activeModal?.data as ImageSelectModalData | undefined;
  const [urlInput, setUrlInput] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { addToast } = useToastStore();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }
      if (!file.type.startsWith('image/')) {
        addToast('Please select an image file (PNG, JPG, GIF, WebP)', 'error');
        return;
      }
      setSelectedFile(file);
      setUrlInput('');
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    [addToast],
  );

  const handleUseUrl = useCallback(() => {
    const url = urlInput.trim();
    if (!url) {
      addToast('Please enter an image URL', 'error');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
      addToast('URL must start with http://, https://, or be a data URL', 'error');
      return;
    }
    if (!modalData?.updateEntity) return;
    modalData.updateEntity({ imageUrl: url });
    // updateEntity (from Character/Place modal) already closes this modal and re-opens the parent
    setUrlInput('');
    setFilePreview(null);
    setSelectedFile(null);
  }, [urlInput, modalData, addToast]);

  const handleSaveFile = useCallback(() => {
    if (!filePreview || !modalData?.updateEntity) return;
    modalData.updateEntity({ imageUrl: filePreview });
    // updateEntity (from Character/Place modal) already closes this modal and re-opens the parent
    setUrlInput('');
    setFilePreview(null);
    setSelectedFile(null);
  }, [filePreview, modalData]);

  const handleCancel = useCallback(() => {
    setUrlInput('');
    setFilePreview(null);
    setSelectedFile(null);
    closeModal();
  }, [closeModal]);

  if (!modalData) return null;

  const { type } = modalData;
  const hasSelection = urlInput.trim() || filePreview;
  const title =
    type === EntityType.TRIGGER
      ? 'Add background image'
      : type === EntityType.QUICKSTART
        ? 'Add image'
        : `Add ${type} image`;

  return (
    <Modal
      isOpen={activeModal !== null && activeModal.modal === 'selectImage'}
      onClose={handleCancel}
      title={title}
      size="lg"
      actions={
        <div className="flex gap-2 justify-end">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            onClick={filePreview ? handleSaveFile : handleUseUrl}
            disabled={!filePreview && !urlInput.trim()}
          >
            Use this image
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 w-full">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Image URL
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (filePreview) {
                setFilePreview(null);
                setSelectedFile(null);
              }
            }}
            placeholder="https://example.com/image.png"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Or upload from your device
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-200"
          />
        </div>
        {(filePreview || urlInput.trim()) && (
          <div className="mt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Preview</p>
            <div className="relative w-full max-w-xs aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                urlInput.trim() && (
                  <img
                    src={urlInput}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={() => {
                      // Preview may fail due to CORS; user can still use the URL
                      addToast(
                        'Preview unavailable (e.g. CORS). You can still click "Use this image" if the URL is correct.',
                        'info',
                      );
                    }}
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
