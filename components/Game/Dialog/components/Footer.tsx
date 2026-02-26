import { DisplayLine } from '@/app/types';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import { twMerge } from 'tailwind-merge';
import { ProjectContext, ProjectContextType } from '../../ProjectContext';
import Thumbs from '../../Thumbs';

export default function Footer({ currentLine }: { currentLine: DisplayLine }) {
  const projectContext = useContext(ProjectContext) as ProjectContextType | null;
  const currentPlaythrough = projectContext?.currentPlaythrough;
  const readOnly = projectContext?.readOnly;
  const status = currentLine.metadata?.status;
  const showThumbs = currentLine.type !== 'player';

  // Don't show footer for scene breaks
  if (currentLine.metadata?.sceneId !== undefined) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1.0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={twMerge(
        'p-2 flex justify-between items-center gap-1 w-full h-10',
        readOnly && 'pointer-events-none',
        !showThumbs && 'justify-end',
      )}
    >
      {showThumbs && (
        <div>
          <Thumbs
            selectedPlaythrough={currentPlaythrough}
            lineIndex={currentPlaythrough?.currentLineIdx}
            readOnly={readOnly}
          />
        </div>
      )}

      <div className="p-2 h-6 flex items-center">
        {status === 'loading' ? (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading...
          </motion.p>
        ) : status === 'game-over' ? (
          <p>The end.</p>
        ) : currentLine.metadata?.shouldPause && status === 'waiting-on-user' ? (
          <p className="flex items-center gap-1  italic animate-pulse">Say something...</p>
        ) : (
          <p className="italic animate-pulse">
            Click to continue or press <span className="inline-block align-middle">&#8594;</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}
