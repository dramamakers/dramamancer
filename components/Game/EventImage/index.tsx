import { StoryState } from '@/app/types';
import Asset from '@/components/Asset';
import { AnimatePresence, motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

export default function EventImage({ storyState }: { storyState: StoryState }) {
  const { eventImageUrl } = storyState;

  if (!eventImageUrl) return null;
  return (
    <AnimatePresence>
      <motion.div
        key={eventImageUrl}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={twMerge(
          'absolute inset-0 z-[1] flex items-center justify-center pointer-events-none',
          'h-full',
        )}
      >
        <div
          className={twMerge(
            'group relative bg-slate-100 dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden',
            'h-full w-full',
          )}
        >
          <div
            className={twMerge('flex items-center justify-center w-full min-w-80 h-full relative')}
          >
            <AnimatePresence mode="wait">
              <Asset imageUrl={eventImageUrl} />
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
