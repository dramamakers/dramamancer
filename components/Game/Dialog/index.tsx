import { StoryState } from '@/app/types';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import Controls from './components/Controls';

export default function Dialog({
  className,
  onClick,
  storyState,
  children,
  bottomChildren,
}: {
  className?: string;
  onClick?: () => void;
  storyState?: StoryState;
  children?: React.ReactNode;
  bottomChildren?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.05 }}
      layout
      className={twMerge('relative flex flex-col text-lg w-full h-80 p-4', className)}
    >
      {/* Control buttons bar - above the dialog panel */}
      {storyState && <Controls storyState={storyState} />}

      {/* Dialog panel */}
      <motion.div
        layout
        className={twMerge(
          'overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-lg flex',
          onClick && 'cursor-pointer',
        )}
        onClick={onClick}
        style={{
          flex: '1 1 0%',
        }}
      >
        {children}
      </motion.div>
      {bottomChildren}
    </motion.div>
  );
}
