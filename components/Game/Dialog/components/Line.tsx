import { Character, DisplayLine, StoryState } from '@/app/types';
import FeatheredScroll from '@/components/FeatheredScroll';
import { AnimatePresence, motion } from 'framer-motion';
import Footer from './Footer';
import HintText from './Hint';

export default function Line({
  line,
  speaker,
  readOnly,
  storyState,
  backgroundImageUrl,
}: {
  line: DisplayLine;
  speaker?: Character;
  storyState?: StoryState;
  readOnly?: boolean;
  backgroundImageUrl?: string;
}) {
  const displayText = line.text;
  return (
    <div className="h-full flex flex-col relative w-full">
      {/* Text */}
      <FeatheredScroll className="mb-10 h-full overflow-y-auto" direction="vertical">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="break-words whitespace-pre-wrap p-3"
        >
          {speaker ? (
            <p>
              <b>{speaker.name}</b>
            </p>
          ) : line.characterName ? (
            <p>
              <b>{line.characterName}</b>
            </p>
          ) : null}
          {line.type === 'hint' ? (
            <HintText
              text={displayText}
              storyState={storyState}
              backgroundImageUrl={backgroundImageUrl}
            />
          ) : (
            <p>{displayText}</p>
          )}
        </motion.div>
      </FeatheredScroll>

      {/* Footer */}
      {!readOnly && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 w-full"
          >
            <Footer currentLine={line} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
