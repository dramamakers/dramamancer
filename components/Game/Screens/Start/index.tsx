import { useAuth } from '@/components/Auth/AuthContext';
import { useLoginModal } from '@/components/Auth/LoginModalProvider';
import Button from '@/components/Button';
import { formatTimeAgo } from '@/utils/format';
import { getCompletionText } from '@/utils/game';
import { useLocalTranslator } from '@/utils/hooks/useLocalTranslator';
import { isGameOutOfDate } from '@/utils/playthrough';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { useProject } from '../../ProjectContext';
import CharacterPreviews from './CharacterPreviews';

export default function Start() {
  const { project, playthroughs, loading, updatePlaythrough } = useProject();
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();

  const completion = getCompletionText(playthroughs, project);
  const { userId, userDisplayName } = project;
  const {
    translatedTexts: [title, shortDescription],
  } = useLocalTranslator({
    texts: [project.title, project.settings.shortDescription],
  });
  const lastPlaythrough = playthroughs.sort((a, b) => b.createdAt - a.createdAt)[0];
  const lastPlaythroughEnded =
    lastPlaythrough?.lines[lastPlaythrough.lines.length - 1]?.metadata?.shouldEnd;
  const lastPlaythroughIsOutOfDate = lastPlaythrough && isGameOutOfDate(project, lastPlaythrough);

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm select-none p-4" />
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm select-none p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, delay: 0.3 }}
        className="flex flex-col gap-3 items-center"
      >
        {/* Game Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold">{title || 'Untitled game'}</h1>
          <p className="text-slate-700 dark:text-slate-300 italic">{shortDescription}</p>
          <p className="text-slate-600 dark:text-slate-400">
            by{' '}
            <a href={`/users/${encodeURIComponent(userId)}`} className="underline">
              {userDisplayName || userId || 'Anonymous'}
            </a>
          </p>
          <div className="flex flex-col gap-1 items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">{completion}</p>
          </div>
        </div>

        {/* Visual Novel Menu */}
        <div className="flex flex-col gap-2 items-center max-w-full w-md">
          <div className="block w-full flex flex-col gap-2 p-2">
            <CharacterPreviews />

            <div className="flex flex-col mt-2 gap-1 items-center">
              {lastPlaythrough && (
                <Button
                  onClick={() => {
                    updatePlaythrough({ action: 'load', playthrough: lastPlaythrough });
                  }}
                  className={twMerge(
                    'w-full',
                    lastPlaythroughEnded && 'opacity-50',
                    lastPlaythroughIsOutOfDate && 'opacity-50',
                  )}
                >
                  Continue {lastPlaythrough?.title ? `"${lastPlaythrough.title}"` : 'last game'}
                  <p className="text-xs opacity-75">
                    {formatTimeAgo(lastPlaythrough?.updatedAt)}
                    {lastPlaythroughEnded && ` (ended)`}{' '}
                    {lastPlaythroughIsOutOfDate && ` (outdated version)`}
                  </p>
                </Button>
              )}
              <Button
                className="w-full"
                onClick={async () => {
                  if (!user) {
                    await openLoginModal();
                    if (!user) return;
                  }
                  updatePlaythrough({ action: 'create' });
                }}
              >
                {lastPlaythrough ? 'New game' : 'Play'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
