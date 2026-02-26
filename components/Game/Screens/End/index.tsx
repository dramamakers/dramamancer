import { DisplayLine } from '@/app/types';
import Button from '@/components/Button';
import { useTooltip } from '@/components/Tooltip';
import { usePlaythroughViewer } from '@/utils/api/hooks';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  HandThumbUpIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import EventImage from '../../EventImage';
import { useProject } from '../../ProjectContext';

function IconButton(buttonProps: React.ComponentProps<typeof Button> & { icon: React.ReactNode }) {
  const { className, ...rest } = buttonProps;
  return (
    <Button
      className={twMerge(
        'bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 text-white hover:text-white flex items-center gap-3 text-lg font-medium transition-all duration-200',
        className,
      )}
      {...rest}
    >
      {buttonProps.icon}
    </Button>
  );
}

export function EndBreak({
  currentLine,
  setShowHistory,
}: {
  currentLine: DisplayLine;
  setShowHistory: (show: boolean) => void;
}) {
  const { currentPlaythrough, storyState, updatePlaythrough, sharePlaythrough } = useProject();
  const { showTooltip, hideTooltip } = useTooltip();
  const { liked, togglePlaythroughLike } = usePlaythroughViewer(
    currentPlaythrough?.id ?? 0,
    currentPlaythrough?.liked ? 1 : 0,
  );
  const eventImage = currentLine.metadata?.eventImageUrl;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center items-center overflow-visible pointer-events-none z-[3]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Background overlay */}
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />

      {/* Main content container */}
      <div className="relative flex flex-col items-center justify-center gap-4 max-w-2xl px-8 pointer-events-auto text-center">
        <div>
          <p className="text-2xl flex flex-col gap-2 text-white">{currentLine?.text}</p>
          <p className="text-white/50!">
            Restart from a{' '}
            <a
              onClick={() => {
                // Open history
                setShowHistory(true);
              }}
              className="text-white!"
            >
              previous line
            </a>{' '}
            or{' '}
            <a onClick={() => updatePlaythrough({ action: 'clear' })} className="text-white!">
              from the start
            </a>
          </p>
        </div>

        {eventImage && (
          <div className="flex flex-col gap-2 h-[40%]">
            <div className="w-full p-[2px] overflow-hidden rounded-lg shadow-lg">
              <EventImage storyState={storyState} />
            </div>
          </div>
        )}

        {/* Decorative bottom line */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-white/60 to-transparent w-32"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        />

        {/* Like Question Section */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <IconButton
            icon={<ArrowLeftIcon className="w-5 h-5" />}
            onMouseOver={() => showTooltip('Go back')}
            onMouseOut={hideTooltip}
            onClick={() => {
              hideTooltip();
              storyState.handleBack();
            }}
          />
          <IconButton
            onMouseOver={() =>
              showTooltip(
                currentPlaythrough?.liked ? 'Unlike this playthrough' : 'Like this playthrough',
              )
            }
            onMouseOut={hideTooltip}
            onClick={async () => {
              hideTooltip();
              await togglePlaythroughLike();
            }}
            icon={
              liked ? (
                <HandThumbUpSolidIcon className="w-5 h-5" />
              ) : (
                <HandThumbUpIcon className="w-5 h-5" />
              )
            }
          />
          <IconButton
            onMouseOver={() => showTooltip('Share this playthrough')}
            onMouseOut={hideTooltip}
            onClick={() => {
              hideTooltip();
              sharePlaythrough(currentPlaythrough);
            }}
            icon={<ShareIcon className="w-5 h-5" />}
          />

          <div className="relative">
            <IconButton
              onMouseOver={() => showTooltip('Restart the playthrough')}
              onMouseOut={hideTooltip}
              onClick={() => {
                hideTooltip();
                updatePlaythrough({
                  action: 'create',
                });
              }}
              icon={<ArrowPathIcon className="w-5 h-5" />}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
