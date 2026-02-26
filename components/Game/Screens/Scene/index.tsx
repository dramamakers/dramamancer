import { DisplayLine } from '@/app/types';
import { getSceneTitle } from '@/utils/game';
import { motion } from 'framer-motion';
import { useProject } from '../../ProjectContext';

export function SceneBreak({
  handleNext,
  currentLine,
}: {
  handleNext: () => void;
  currentLine: DisplayLine;
}) {
  const { storyState, project } = useProject();
  const currentScene = storyState.currentScene;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center items-center overflow-visibler pointer-events-none z-[3]"
      onClick={() => {
        handleNext();
      }}
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
      <motion.div
        className="relative flex flex-col items-center space-y-6 max-w-2xl mx-auto px-8"
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Decorative top line */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-white/60 to-transparent w-32"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Scene title - responsive based on text length */}
        <motion.div
          className="text-center w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-white mb-2 tracking-wide text-2xl">
            {getSceneTitle(project.cartridge.scenes, currentScene.uuid)}
          </p>
          <p className="italic text-slate-200 animate-pulse">
            {currentLine.metadata?.status === 'loading' ? 'Loading...' : 'Click to continue'}
          </p>
        </motion.div>

        {/* Decorative bottom line */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-white/60 to-transparent w-32"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        />
      </motion.div>
    </motion.div>
  );
}
