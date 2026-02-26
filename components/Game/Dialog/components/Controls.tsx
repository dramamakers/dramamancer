import { StoryState } from '@/app/types';
import Button from '@/components/Button';
import { useTooltip } from '@/components/Tooltip';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  BookOpenIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { useProject } from '../../ProjectContext';

export default function Controls({ storyState }: { storyState: StoryState }) {
  const {
    readOnly,
    currentPlaythrough,
    mode,
    sharePlaythrough,
    updatePlaythrough,
    handleShowHistory,
  } = useProject();
  const { showTooltip, hideTooltip } = useTooltip();
  const { handleNext, handleBack } = storyState;
  const showDebug = mode === 'edit';

  if (!currentPlaythrough) return null;
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center gap-2 mb-2 pointer-events-none"
      >
        {/* Navigation buttons group */}
        <div className="flex items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-lg overflow-hidden">
          {/* Back button */}
          <Button
            variant="icon"
            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-none pointer-events-auto"
            disabled={storyState.disabledBack}
            onClick={(e) => {
              e.stopPropagation();
              handleBack();
            }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>

          {/* Forward button */}
          <>
            <div className="w-1" />
            <div className="h-6 bg-slate-400/30" />
            <Button
              variant="icon"
              className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-none pointer-events-auto"
              disabled={storyState.disabledNext}
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ArrowRightIcon className="w-5 h-5" />
            </Button>
          </>
        </div>

        {/* Right side buttons group */}
        <div className="flex items-center ml-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-lg overflow-hidden">
          {/* History button */}
          <Button
            variant="icon"
            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-none flex items-center pointer-events-auto"
            onMouseOver={() => showTooltip('Playthrough history')}
            onMouseOut={hideTooltip}
            onClick={(e) => {
              e.stopPropagation();
              hideTooltip();
              handleShowHistory(true);
            }}
          >
            <BookOpenIcon className="w-5 h-5" />
            <span className="@2xl:block hidden ml-1 text-sm">History</span>
          </Button>

          {/* Divider in compact mode */}
          {!readOnly && <div className="w-px h-6 bg-slate-400/30" />}

          {/* Share button */}
          {!readOnly && mode === 'play' && (
            <Button
              variant="icon"
              className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-none flex items-center pointer-events-auto"
              onMouseOver={() => showTooltip('Share your playthrough')}
              onMouseOut={hideTooltip}
              onClick={(e) => {
                e.stopPropagation();
                hideTooltip();
                sharePlaythrough(currentPlaythrough);
              }}
            >
              <ShareIcon className="w-5 h-5" />
              <span className="@2xl:block hidden ml-1 text-sm">Share</span>
            </Button>
          )}

          {/* Divider in compact mode */}
          {showDebug && <div className="w-px h-6 bg-slate-400/30" />}

          {/* Restart button */}
          {!readOnly && (
            <Button
              variant="icon"
              className={twMerge(
                'p-2 hover:bg-black/10 dark:hover:bg-white/10 flex items-center rounded-none pointer-events-auto',
              )}
              onMouseOver={() => showTooltip('Restart the playthrough')}
              onMouseOut={hideTooltip}
              onClick={(e) => {
                e.stopPropagation();
                hideTooltip();
                updatePlaythrough({
                  action: 'clear',
                });
              }}
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span className="@2xl:block hidden ml-1 text-sm">Restart</span>
            </Button>
          )}

          {/* Divider in compact mode */}
          {showDebug && <div className="w-px h-6 bg-slate-400/30" />}
        </div>
      </motion.div>
    </>
  );
}
