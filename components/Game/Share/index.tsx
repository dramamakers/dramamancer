import { Playthrough, Visibility } from '@/app/types';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToastStore } from '@/store/toast';
import { ClipboardDocumentIcon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { useProject } from '../ProjectContext';

const visibilityOptions = [
  {
    value: 'unlisted' as const,
    title: 'Unlisted',
    description: 'Only people with the link can view this playthrough',
    icon: LockClosedIcon,
  },
  {
    value: 'public' as const,
    title: 'Public',
    description: 'Anyone can discover and view this playthrough',
    icon: GlobeAltIcon,
  },
];

export default function ShareModal({
  isOpen,
  onClose,
  playthrough,
}: {
  isOpen: boolean;
  onClose: () => void;
  playthrough: Playthrough;
}) {
  const { updatePlaythrough } = useProject();
  const { addToast } = useToastStore();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(playthrough.title || '');
  const [visibility, setVisibility] = useState<Visibility>(playthrough.visibility);
  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/play/${playthrough.projectId}?playthroughId=${playthrough.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast('Share link copied to clipboard!', 'success', 3000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      addToast('Share link copied to clipboard!', 'success', 3000);
    }
  };

  const shareUrl = `${window.location.origin}/play/${playthrough.projectId}?playthroughId=${playthrough.id}`;

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (title !== (playthrough.title || '')) {
        try {
          setError(null);
          await updatePlaythrough({
            action: 'settings',
            playthroughId: playthrough.id,
            updates: { title },
          });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to update title');
          setTitle(playthrough.title || '');
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [title, playthrough.title, playthrough.id, updatePlaythrough]);

  const handleVisibilityUpdate = useCallback(
    async (visibility: Visibility) => {
      try {
        setError(null);
        setVisibility(visibility);
        await updatePlaythrough({
          action: 'settings',
          playthroughId: playthrough.id,
          updates: { visibility },
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to update visibility');
        setVisibility(playthrough.visibility);
      }
    },
    [updatePlaythrough, playthrough.id, playthrough.visibility],
  );

  const isSelected = (option: Visibility) => {
    if (visibility === 'private') {
      return 'public' === option;
    }
    return visibility === option;
  };

  return (
    <Modal isOpen={isOpen} title={`Share your playthrough`} onClose={onClose} size="sm">
      <div className="space-y-6">
        {error && <p className="text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}

        {/* Title */}
        <div>
          <h2 className="text-lg font-medium">Title</h2>
          <input
            placeholder="Untitled playthrough"
            type="text"
            value={title}
            className="w-full"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Visibility options */}
        <div>
          <h2 className="text-lg font-medium">Visibility</h2>

          <div className="space-y-2">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className="flex flex-col items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3 py-1">
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={isSelected(option.value)}
                      onChange={() => handleVisibilityUpdate(option.value)}
                      className="mt-1"
                    />
                    <Icon className="w-5 h-5 mt-0.5 text-slate-500 dark:text-slate-400" />
                    <div className="flex justify-between items-center gap-2">
                      <div className="font-medium">{option.title}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {option.description}
                      </div>
                    </div>
                  </div>

                  {/* Share link section */}
                  {isSelected(option.value) && (
                    <div className="w-full flex items-center gap-2">
                      <div className="flex gap-2 w-full">
                        <input type="text" value={shareUrl} readOnly className="flex-1 text-sm" />
                        <Button onClick={handleCopyLink} className="flex items-center gap-2">
                          <ClipboardDocumentIcon className="w-4 h-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
